/* Tayson PS4 webkit - central firmware router */
(function () {
    "use strict";

    var statusEl = document.getElementById("msgs");
    var config = window.TaysonHostConfig;

    function setStatus(message, state) {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.className = "status-text" + (state ? " " + state : "");
    }

    function readLocal(key) {
        try { return window.localStorage.getItem(key) || ""; }
        catch (e) { return ""; }
    }

    function writeLocal(key, value) {
        try { window.localStorage.setItem(key, String(value)); }
        catch (e) {}
    }

    function getFirmware() {
        var ua = navigator.userAgent || "";
        var match = ua.match(/PlayStation 4[ \/](\d+)\.(\d+)/i);
        if (!match) return null;
        return { display: match[1] + "." + match[2] };
    }

    function goRecovery(code, fw, familyKey, detail) {
        var url = "recovery.html?code=" + encodeURIComponent(code);
        if (fw) url += "&fw=" + encodeURIComponent(fw);
        if (familyKey) url += "&family=" + encodeURIComponent(familyKey);
        if (detail) url += "&detail=" + encodeURIComponent(detail);
        window.location.replace(url);
    }

    function start() {
        var fw;
        var route;
        var family;
        var attempts;
        var attemptKey;
        var cachedBuild;

        if (!config || !config.routes || !config.families) {
            setStatus("Host configuration is unavailable.", "error");
            return;
        }

        fw = getFirmware();

        if (!fw) {
            setStatus("This page is for PlayStation 4 only.", "error");
            return;
        }

        route = config.routes[fw.display];

        if (!route) {
            setStatus("PS4 " + fw.display + " — unsupported firmware.", "error");
            return;
        }

        family = config.families[route.family];

        if (!family) {
            setStatus("PS4 " + fw.display + " — firmware family configuration is missing.", "error");
            return;
        }

        if (!route.verified) {
            setStatus(
                "PS4 " + fw.display + " detected · " + family.label +
                " is not enabled for automatic loading in this host.",
                "warning"
            );
            return;
        }

        setStatus(
            "PS4 " + fw.display + " detected · verified " + family.label,
            "success"
        );

        cachedBuild = readLocal(family.cacheKey);
        attemptKey = family.cacheKey + "_attempts";

        if (cachedBuild !== family.cacheBuild) {
            attempts = parseInt(readLocal(attemptKey), 10) || 0;

            if (attempts >= config.maxRepairAttempts) {
                setStatus("Offline cache update failed repeatedly · opening recovery...", "error");
                window.setTimeout(function () {
                    goRecovery(
                        "CACHE_STALE",
                        fw.display,
                        route.family,
                        "Expected " + family.cacheBuild + ", found " + (cachedBuild || "none")
                    );
                }, 450);
                return;
            }

            writeLocal(attemptKey, attempts + 1);

            window.setTimeout(function () {
                setStatus(
                    "Preparing " + family.label + " offline cache · attempt " +
                    (attempts + 1) + " of " + config.maxRepairAttempts + "...",
                    "loading"
                );
                window.location.replace(family.cachePage);
            }, 500);
            return;
        }

        writeLocal(attemptKey, 0);

        window.setTimeout(function () {
            setStatus("Loading verified " + family.label + " chain...", "loading");
            window.location.replace(route.target);
        }, 650);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, false);
    } else {
        start();
    }
}());
