/* Tayson PS4 webkit - central host configuration */
(function () {
    "use strict";

    window.TaysonHostConfig = {
        release: "20260829-11",
        maxRepairAttempts: 2,

        routes: {
            "11.50": { verified: true,  family: "lapse", target: "run_lapse.html?bug=lapse" },
            "12.00": { verified: false, family: "lapse" },
            "12.02": { verified: true,  family: "lapse", target: "run_lapse.html?bug=lapse" },
            "12.50": { verified: false, family: "poops" },
            "12.52": { verified: false, family: "poops" },
            "13.00": { verified: true,  family: "poops", target: "run_poops.html?bug=poops" }
        },

        families: {
            lapse: {
                label: "Lapse",
                cachePage: "cache_lapse.html",
                manifest: "lapse.manifest",
                cacheKey: "tayson_cache_lapse_build",
                cacheBuild: "20260829-L1"
            },
            poops: {
                label: "Poops",
                cachePage: "cache_poops.html",
                manifest: "poops.manifest",
                cacheKey: "tayson_cache_poops_build",
                cacheBuild: "20260829-P1"
            }
        }
    };
}());
