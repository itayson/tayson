/* Tayson PS4 webkit - firmware router
   Keeps firmware detection and page routing separate from exploit code.
   Existing exploit/payload files are intentionally left untouched. */
(function () {
    "use strict";

    var statusEl = document.getElementById("msgs");

    function setStatus(message, state) {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.className = "status-text" + (state ? " " + state : "");
    }

    function parsePS4Firmware() {
        var ua = navigator.userAgent || "";
        var match = ua.match(/PlayStation 4[ \/](\d+)\.(\d+)/i);
        if (!match) return null;

        var major = parseInt(match[1], 10);
        var minor = parseInt(match[2], 10);

        return {
            display: match[1] + "." + match[2],
            number: (major * 100) + minor
        };
    }

    function routeForFirmware(fw) {
        if (!fw) return { supported: false, reason: "This page is for PS4 only." };

        /* Current repository has local chains for 11.50-13.00.
           Older families are recognized here so the router is ready for
           separate implementations without mixing them into one chain. */
        if (fw.number >= 700 && fw.number <= 852) {
            return { supported: false, family: "7.00-8.52", reason: "Firmware detected, but this chain is not installed in this host." };
        }
        if (fw.number >= 900 && fw.number <= 960) {
            return { supported: false, family: "9.00-9.60", reason: "Firmware detected, but this chain is not installed in this host." };
        }
        if (fw.number >= 1000 && fw.number <= 1102) {
            return { supported: false, family: "10.00-11.02", reason: "Firmware detected, but this chain is not installed in this host." };
        }
        if (fw.number >= 1150 && fw.number <= 1202) {
            return { supported: true, family: "11.50-12.02", target: "run_lapse.html?bug=lapse" };
        }
        if (fw.number >= 1250 && fw.number <= 1300) {
            return { supported: true, family: "12.50-13.00", target: "run_poops.html?bug=poops" };
        }

        return { supported: false, reason: "Unsupported firmware: " + fw.display };
    }

    function start() {
        var fw = parsePS4Firmware();
        var route = routeForFirmware(fw);

        if (!fw) {
            setStatus("This page is for PS4 only.", "error");
            return;
        }

        if (!route.supported) {
            setStatus("PS4 " + fw.display + " — " + route.reason, "error");
            return;
        }

        setStatus("PS4 " + fw.display + " detected · " + route.family, "success");

        window.setTimeout(function () {
            setStatus("Loading local chain…", "loading");
            window.location.replace(route.target);
        }, 900);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
}());
