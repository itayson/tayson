/* Tayson PS4 webkit - firmware router
   Reference architecture: firmware-aware routing + dedicated offline cache.
   Exploit chains and payloads remain local and are not modified here. */
(function () {
    "use strict";

    var statusEl = document.getElementById("msgs");

    function setStatus(message, state) {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.className = "status-text" + (state ? " " + state : "");
    }

    function getFirmware() {
        var ua = navigator.userAgent || "";
        var match = ua.match(/PlayStation 4[ \/](\d+)\.(\d+)/i);

        if (!match) return null;

        return {
            display: match[1] + "." + match[2]
        };
    }

    function getRoute(version) {
        var routes = {
            "11.50": { family: "Lapse", target: "run_lapse.html?bug=lapse" },
            "12.00": { family: "Lapse", target: "run_lapse.html?bug=lapse" },
            "12.02": { family: "Lapse", target: "run_lapse.html?bug=lapse" },
            "12.50": { family: "Poops", target: "run_poops.html?bug=poops" },
            "12.52": { family: "Poops", target: "run_poops.html?bug=poops" },
            "13.00": { family: "Poops", target: "run_poops.html?bug=poops" }
        };

        return routes[version] || null;
    }

    function start() {
        var fw = getFirmware();
        var route;
        var appCache = window.applicationCache;

        if (!fw) {
            setStatus("This page is for PlayStation 4 only.", "error");
            return;
        }

        route = getRoute(fw.display);

        if (!route) {
            setStatus("PS4 " + fw.display + " — unsupported or unverified firmware.", "error");
            return;
        }

        setStatus("PS4 " + fw.display + " detected · " + route.family, "success");

        if (appCache && appCache.status === 0) {
            window.setTimeout(function () {
                setStatus("Preparing offline cache...", "loading");
                window.location.replace("cache_slopkit.html");
            }, 500);
            return;
        }

        window.setTimeout(function () {
            setStatus("Loading local chain...", "loading");
            window.location.replace(route.target);
        }, 700);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, false);
    } else {
        start();
    }
}());
