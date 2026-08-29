/* Tayson PS4 webkit - verified firmware router
   Safety preflight + cache repair loop protection.
   Exploit chains and payload files are intentionally left untouched. */
(function () {
    "use strict";

    var statusEl = document.getElementById("msgs");
    var CACHE_KEY = "tayson_slopkit_cache_build";
    var CACHE_BUILD = "20260829-5";
    var ATTEMPT_KEY = "tayson_cache_repair_attempts";
    var MAX_REPAIR_ATTEMPTS = 2;

    function setStatus(message, state) {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.className = "status-text" + (state ? " " + state : "");
    }

    function readLocal(key) {
        try {
            return window.localStorage.getItem(key) || "";
        } catch (e) {
            return "";
        }
    }

    function writeLocal(key, value) {
        try {
            window.localStorage.setItem(key, String(value));
        } catch (e) {}
    }

    function getFirmware() {
        var ua = navigator.userAgent || "";
        var match = ua.match(/PlayStation 4[ \/](\d+)\.(\d+)/i);

        if (!match) return null;

        return { display: match[1] + "." + match[2] };
    }

    function getRoute(version) {
        var routes = {
            "11.50": { verified: true, family: "Lapse", target: "run_lapse.html?bug=lapse" },
            "12.00": { verified: false, family: "Lapse" },
            "12.02": { verified: true, family: "Lapse", target: "run_lapse.html?bug=lapse" },
            "12.50": { verified: false, family: "Poops" },
            "12.52": { verified: false, family: "Poops" },
            "13.00": { verified: true, family: "Poops", target: "run_poops.html?bug=poops" }
        };

        return routes[version] || null;
    }

    function goRecovery(code, fw, detail) {
        var url = "recovery.html?code=" + encodeURIComponent(code);
        if (fw) url += "&fw=" + encodeURIComponent(fw);
        if (detail) url += "&detail=" + encodeURIComponent(detail);
        window.location.replace(url);
    }

    function start() {
        var fw = getFirmware();
        var route;
        var cacheBuild;
        var attempts;

        if (!fw) {
            setStatus("This page is for PlayStation 4 only.", "error");
            return;
        }

        route = getRoute(fw.display);

        if (!route) {
            setStatus("PS4 " + fw.display + " — unsupported firmware.", "error");
            return;
        }

        if (!route.verified) {
            setStatus("PS4 " + fw.display + " detected · " + route.family + " is not verified on hardware, so auto-run is blocked.", "warning");
            return;
        }

        setStatus("PS4 " + fw.display + " detected · verified " + route.family, "success");

        cacheBuild = readLocal(CACHE_KEY);

        if (cacheBuild !== CACHE_BUILD) {
            attempts = parseInt(readLocal(ATTEMPT_KEY), 10) || 0;

            if (attempts >= MAX_REPAIR_ATTEMPTS) {
                setStatus("Offline cache update failed repeatedly · opening recovery...", "error");
                window.setTimeout(function () {
                    goRecovery("CACHE_STALE", fw.display, "Expected " + CACHE_BUILD + ", found " + (cacheBuild || "none"));
                }, 500);
                return;
            }

            writeLocal(ATTEMPT_KEY, attempts + 1);
            window.setTimeout(function () {
                setStatus("Preparing offline cache · attempt " + (attempts + 1) + " of " + MAX_REPAIR_ATTEMPTS + "...", "loading");
                window.location.replace("cache_slopkit.html");
            }, 500);
            return;
        }

        writeLocal(ATTEMPT_KEY, 0);

        window.setTimeout(function () {
            setStatus("Loading verified local chain...", "loading");
            window.location.replace(route.target);
        }, 700);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, false);
    } else {
        start();
    }
}());
