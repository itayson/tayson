/* Tayson PS4 webkit - verified firmware router
   Safety preflight: only firmware rows marked proven are auto-routed.
   Exploit chains and payload files are intentionally left untouched. */
(function () {
    "use strict";

    var statusEl = document.getElementById("msgs");
    var CACHE_KEY = "tayson_slopkit_cache_build";
    var CACHE_BUILD = "20260829-3";

    function setStatus(message, state) {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.className = "status-text" + (state ? " " + state : "");
    }

    function readCacheBuild() {
        try {
            return window.localStorage.getItem(CACHE_KEY) || "";
        } catch (e) {
            return "";
        }
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
            "12.02": { verified: false, family: "Lapse" },
            "12.50": { verified: false, family: "Poops" },
            "12.52": { verified: false, family: "Poops" },
            "13.00": { verified: true, family: "Poops", target: "run_poops.html?bug=poops" }
        };

        return routes[version] || null;
    }

    function start() {
        var fw = getFirmware();
        var route;

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

        if (readCacheBuild() !== CACHE_BUILD) {
            window.setTimeout(function () {
                setStatus("Preparing offline cache...", "loading");
                window.location.replace("cache_slopkit.html");
            }, 500);
            return;
        }

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
