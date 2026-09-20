/* Tayson PS4 webkit - single-page firmware router */
(function () {
    "use strict";

    var statusEl = document.getElementById("state");
    var firmwareEl = document.getElementById("status-fw");
    var familyEl = document.getElementById("status-family");
    var cacheEl = document.getElementById("status-cache");
    var config = window.TaysonHostConfig;
    var cacheFrame = null;
    var cacheTimer = 0;
    var currentFirmware = "";
    var currentRoute = null;
    var currentFamily = null;
    var started = false;

    var goldhenPanel = document.getElementById("goldhen-panel");
    var goldhenSelect = document.getElementById("goldhen-version");
    var goldhenApply = document.getElementById("goldhen-apply");
    var goldhenChange = document.getElementById("goldhen-change");
    var goldhenCurrentLabel = document.getElementById("goldhen-current-label");
    var selectedPayload = null;

    function setStatus(message, state) {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.className = "status-text" + (state ? " " + state : "");
    }

    function setDetail(element, value, state) {
        if (!element) return;
        element.textContent = value;
        element.className = "status-value" + (state ? " " + state : "");
    }

    function setCacheDetail(value, state) {
        setDetail(cacheEl, value, state);
    }

    function compactCacheProgress(message) {
        var percent = String(message || "").match(/\d+%/);
        if (percent) return "Installing " + percent[0];
        if (/checking/i.test(message)) return "Checking";
        if (/downloading/i.test(message)) return "Downloading";
        if (/ready|installed|updated|up to date/i.test(message)) return "Ready";
        return "Installing";
    }

    function readLocal(key) {
        try { return window.localStorage.getItem(key) || ""; } catch (e) { return ""; }
    }

    function writeLocal(key, value) {
        try { window.localStorage.setItem(key, String(value)); } catch (e) {}
    }

    function removeLocal(key) {
        try { window.localStorage.removeItem(key); } catch (e) {}
    }

    function readSession(key) {
        try { return window.sessionStorage.getItem(key) || ""; } catch (e) { return ""; }
    }

    function writeSession(key, value) {
        try {
            window.sessionStorage.setItem(key, String(value));
            return window.sessionStorage.getItem(key) === String(value);
        } catch (e) {
            return false;
        }
    }

    function removeSession(key) {
        try { window.sessionStorage.removeItem(key); } catch (e) {}
    }

    function queryValue(name) {
        var query = (window.location.search || "").replace(/^\?/, "").split("&");
        var i, pair, key, value;
        for (i = 0; i < query.length; i++) {
            if (!query[i]) continue;
            pair = query[i].split("=");
            key = decodeURIComponent(pair[0] || "");
            if (key === name) {
                value = pair.slice(1).join("=") || "";
                return decodeURIComponent(value.replace(/\+/g, " "));
            }
        }
        return "";
    }

    function payloadExists(version) {
        return !!(
            version &&
            config &&
            config.payloads &&
            Object.prototype.hasOwnProperty.call(config.payloads, version)
        );
    }

    function setPayloadSelection(version, persist) {
        var payload;

        if (!payloadExists(version)) {
            version = config.defaultPayloadVersion;
        }

        payload = config.resolvePayload ?
            config.resolvePayload(version) :
            (config.payloads && config.payloads[version] ? config.payloads[version] : config.payload);

        selectedPayload = payload || config.payload;

        if (persist && selectedPayload && selectedPayload.version) {
            writeLocal(config.payloadPreferenceKey || "tayson_goldhen_version", selectedPayload.version);
        }

        window.TaysonSelectedPayload = selectedPayload;
        window.TaysonSelectedPayloadPath =
            selectedPayload && selectedPayload.path ? selectedPayload.path : "payload.bin";

        if (goldhenCurrentLabel && selectedPayload) {
            goldhenCurrentLabel.textContent =
                selectedPayload.label +
                (selectedPayload.experimental ? " · experimental" : " · recommended");
        }

        return selectedPayload;
    }

    function populatePayloadChoices() {
        var version, option, payload;

        if (!goldhenSelect || !config || !config.payloads) return;

        while (goldhenSelect.firstChild) {
            goldhenSelect.removeChild(goldhenSelect.firstChild);
        }

        for (version in config.payloads) {
            if (!Object.prototype.hasOwnProperty.call(config.payloads, version)) continue;
            payload = config.payloads[version];
            option = document.createElement("option");
            option.value = version;
            option.textContent =
                payload.label +
                (payload.experimental ? " · experimental" : " · recommended");
            if (selectedPayload && selectedPayload.version === version) {
                option.selected = true;
            }
            goldhenSelect.appendChild(option);
        }
    }

    function preparePayloadChoice() {
        var key = config.payloadPreferenceKey || "tayson_goldhen_version";
        var requested = queryValue("goldhen");
        var stored = readLocal(key);
        var validRequested = payloadExists(requested);
        var validStored = payloadExists(stored);
        var chooseMode;

        if (stored && !validStored) {
            removeLocal(key);
            stored = "";
        }

        if (validRequested) {
            setPayloadSelection(requested, true);
        } else if (validStored) {
            setPayloadSelection(stored, false);
        } else {
            setPayloadSelection(config.defaultPayloadVersion, false);
        }

        populatePayloadChoices();

        if (goldhenChange) {
            goldhenChange.href = "index.html?choose=1";
        }

        chooseMode = queryValue("choose") === "1" || (!validRequested && !validStored);

        if (!chooseMode) {
            if (goldhenPanel) goldhenPanel.hidden = true;
            return true;
        }

        if (goldhenPanel) goldhenPanel.hidden = false;

        if (goldhenApply) {
            goldhenApply.onclick = function () {
                var version = goldhenSelect ? goldhenSelect.value : config.defaultPayloadVersion;
                if (!payloadExists(version)) {
                    version = config.defaultPayloadVersion;
                }
                writeLocal(key, version);
                window.location.replace("index.html?goldhen=" + encodeURIComponent(version));
                return false;
            };
        }

        setCacheDetail("Waiting", "warning");
        setStatus(
            "PS4 " + currentFirmware + " · choose GoldHEN before starting the jailbreak.",
            "warning"
        );
        return false;
    }

    function cacheActivationKey() {
        return currentFamily ? currentFamily.cacheKey + "_activation" : "";
    }

    function firmware() {
        var m = (navigator.userAgent || "").match(/PlayStation 4[ \/](\d+)\.(\d+)/i);
        return m ? m[1] + "." + m[2] : "";
    }

    function recovery(code, fw, family, detail) {
        var u = "recovery.html?code=" + encodeURIComponent(code);
        if (fw) u += "&fw=" + encodeURIComponent(fw);
        if (family) u += "&family=" + encodeURIComponent(family);
        if (detail) u += "&detail=" + encodeURIComponent(detail);
        window.location.replace(u);
    }

    function cleanupCacheFrame() {
        if (cacheTimer) {
            window.clearTimeout(cacheTimer);
            cacheTimer = 0;
        }
        window.removeEventListener("message", onCacheMessage, false);
        if (cacheFrame && cacheFrame.parentNode) {
            cacheFrame.parentNode.removeChild(cacheFrame);
        }
        cacheFrame = null;
    }

    function moduleFailed(detail) {
        if (currentFamily) removeLocal(currentFamily.cacheKey);
        setCacheDetail("Module error", "error");
        setStatus("Required local module failed to load · opening recovery...", "error");
        window.setTimeout(function () {
            recovery(
                "MODULE_LOAD_FAILED",
                currentFirmware || "unknown",
                currentRoute ? currentRoute.family : "",
                detail || (currentFamily ? currentFamily.entry : "unknown")
            );
        }, 700);
    }

    function loadModule(entry) {
        var script = document.createElement("script");
        script.type = "module";
        script.src = entry;
        script.onerror = function () { moduleFailed(entry); };
        document.body.appendChild(script);
    }

    function loadChain(entry) {
        var script = document.createElement("script");
        window.__taysonModuleFailed = function () { moduleFailed(entry); };
        script.type = "module";
        script.textContent = 'import("./' + entry + '").catch(function(){window.__taysonModuleFailed();});';
        document.body.appendChild(script);
    }

    function loadCss(entry) {
        var failed = false;
        var script = document.createElement("script");

        function fail(detail) {
            if (failed) return;
            failed = true;
            moduleFailed(detail || entry);
        }

        window.exploitChain = "lapse";
        window.addEventListener("error", function (event) {
            if (event && event.filename && event.filename.indexOf("/vendor/css/") !== -1) {
                fail(event.filename);
            }
        }, false);
        script.src = entry;
        script.onerror = function () { fail(entry); };
        script.onload = function () {
            if (typeof window.doJb !== "function") {
                fail("doJb unavailable");
                return;
            }
            window.doJb();
        };
        document.head.appendChild(script);
    }

    function startExploit() {
        var payloadLabel;
        if (started) return;
        started = true;

        payloadLabel = selectedPayload && selectedPayload.label ? selectedPayload.label : (config.payload && config.payload.label ? config.payload.label : "GoldHEN");
        setCacheDetail("Ready", "success");
        setStatus(
            "PS4 " + currentFirmware + " · running " + currentFamily.label + " · " + payloadLabel,
            "success"
        );

        if (currentRoute.family === "psfree") {
            loadModule(currentFamily.entry);
        } else if (currentRoute.family === "css") {
            loadCss(currentFamily.entry);
        } else if (currentRoute.family === "lapse" || currentRoute.family === "poops") {
            loadChain(currentFamily.entry);
        } else {
            moduleFailed("Unknown firmware family");
        }
    }

    function onCacheMessage(event) {
        var readyPrefix, progressPrefix, errorPrefix, data;
        if (!cacheFrame || event.source !== cacheFrame.contentWindow || typeof event.data !== "string") return;

        readyPrefix = "TAYSON_CACHE_READY:" + currentRoute.family;
        progressPrefix = "TAYSON_CACHE_PROGRESS:" + currentRoute.family + ":";
        errorPrefix = "TAYSON_CACHE_ERROR:" + currentRoute.family + ":";
        data = event.data;

        if (data.indexOf(progressPrefix) === 0) {
            setStatus(data.slice(progressPrefix.length), "loading");
            setCacheDetail(compactCacheProgress(data.slice(progressPrefix.length)), "loading");
            return;
        }

        if (data === readyPrefix) {
            writeLocal(currentFamily.cacheKey, currentFamily.cacheBuild);
            writeLocal(currentFamily.cacheKey + "_attempts", 0);
            cleanupCacheFrame();
            setCacheDetail("Activating", "loading");
            setStatus(currentFamily.label + " offline cache is ready · activating...", "loading");

            if (writeSession(cacheActivationKey(), currentFamily.cacheBuild)) {
                window.setTimeout(function () { window.location.reload(); }, 150);
            } else {
                setCacheDetail("Ready", "success");
                window.setTimeout(startExploit, 100);
            }
            return;
        }

        if (data.indexOf(errorPrefix) === 0) {
            cleanupCacheFrame();
            removeLocal(currentFamily.cacheKey);
            setCacheDetail("Install failed", "error");
            setStatus("Offline cache installation failed · opening recovery...", "error");
            window.setTimeout(function () {
                recovery("CACHE_INSTALL_FAILED", currentFirmware, currentRoute.family, data.slice(errorPrefix.length));
            }, 700);
        }
    }

    function installCache(attempt) {
        removeSession(cacheActivationKey());
        window.addEventListener("message", onCacheMessage, false);
        cacheFrame = document.createElement("iframe");
        cacheFrame.className = "cache-frame";
        cacheFrame.setAttribute("aria-hidden", "true");
        cacheFrame.setAttribute("tabindex", "-1");
        cacheFrame.src = currentFamily.cachePage +
            (currentFamily.cachePage.indexOf("?") === -1 ? "?" : "&") + "embedded=1";
        document.body.appendChild(cacheFrame);

        setStatus(
            "Preparing " + currentFamily.label + " offline cache · attempt " + attempt +
            " of " + config.maxRepairAttempts + "...",
            "loading"
        );
        setCacheDetail("Preparing", "loading");

        cacheTimer = window.setTimeout(function () {
            cleanupCacheFrame();
            removeLocal(currentFamily.cacheKey);
            setCacheDetail("Timed out", "error");
            setStatus("Offline cache did not respond · opening recovery...", "error");
            window.setTimeout(function () {
                recovery("CACHE_INSTALL_FAILED", currentFirmware, currentRoute.family, "Embedded cache timeout");
            }, 700);
        }, 90000);
    }

    function start() {
        var build, key, attempts;

        if (!config || !config.resolveRoute) {
            setDetail(firmwareEl, "Unknown", "error");
            setDetail(familyEl, "Unavailable", "error");
            setCacheDetail("Unavailable", "error");
            setStatus("Host configuration is unavailable.", "error");
            return;
        }

        currentFirmware = firmware();
        if (!currentFirmware) {
            setDetail(firmwareEl, "Not a PS4", "error");
            setDetail(familyEl, "None", "error");
            setCacheDetail("Not applicable");
            setStatus("This page is for PlayStation 4 only.", "error");
            return;
        }

        setDetail(firmwareEl, currentFirmware, "success");

        currentRoute = config.resolveRoute(currentFirmware);
        if (!currentRoute) {
            setDetail(familyEl, "Unsupported", "error");
            setCacheDetail("Not applicable");
            setStatus("PS4 " + currentFirmware + " · unsupported firmware.", "error");
            return;
        }

        currentFamily = config.families[currentRoute.family];
        if (!currentFamily) {
            setDetail(familyEl, currentRoute.family || "Missing", "error");
            setCacheDetail("Unavailable", "error");
            setStatus("Firmware family configuration is missing.", "error");
            return;
        }

        window.TaysonCurrentRoute = currentRoute;

        if (!currentRoute.verified) {
            setDetail(familyEl, currentFamily.label, "warning");
            setCacheDetail("Lab locked", "warning");
            setStatus(
                "PS4 " + currentFirmware + " · " +
                (currentRoute.validation || "experimental") +
                " · automatic loading is locked." +
                (currentRoute.reason ? " " + currentRoute.reason : ""),
                "warning"
            );
            return;
        }

        setDetail(familyEl, currentFamily.label, "success");

        if (!preparePayloadChoice()) {
            return;
        }

        build = readLocal(currentFamily.cacheKey);
        key = currentFamily.cacheKey + "_attempts";

        if (build !== currentFamily.cacheBuild) {
            setCacheDetail(build ? "Outdated" : "Not installed", "warning");
            attempts = parseInt(readLocal(key), 10) || 0;

            if (attempts >= config.maxRepairAttempts) {
                setCacheDetail("Repair failed", "error");
                setStatus("Offline cache update failed repeatedly · opening recovery...", "error");
                window.setTimeout(function () {
                    recovery(
                        "CACHE_STALE",
                        currentFirmware,
                        currentRoute.family,
                        "Expected " + currentFamily.cacheBuild + ", found " + (build || "none")
                    );
                }, 450);
                return;
            }

            writeLocal(key, attempts + 1);
            installCache(attempts + 1);
            return;
        }

        writeLocal(key, 0);
        if (readSession(cacheActivationKey()) === currentFamily.cacheBuild) {
            removeSession(cacheActivationKey());
            setStatus(currentFamily.label + " offline cache activated · starting...", "success");
        }
        setCacheDetail("Ready", "success");
        startExploit();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, false);
    } else {
        start();
    }
}());
