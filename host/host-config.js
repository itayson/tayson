/* Tayson PS4 webkit - central host configuration */
(function () {
    "use strict";
    function versionNumber(version) {
        var m = String(version || "").match(/^(\d+)\.(\d+)$/);
        if (!m) return -1;
        return (parseInt(m[1], 10) * 100) + parseInt(m[2], 10);
    }
    var cfg = {
        release: "20260829-13",
        maxRepairAttempts: 2,
        routes: {
            "11.50": { verified: true, family: "lapse", target: "run_lapse.html?bug=lapse" },
            "12.00": { verified: false, family: "lapse" },
            "12.02": { verified: true, family: "lapse", target: "run_lapse.html?bug=lapse" },
            "12.50": { verified: false, family: "poops" },
            "12.52": { verified: false, family: "poops" },
            "13.00": { verified: true, family: "poops", target: "run_poops.html?bug=poops" }
        },
        rangeRoutes: [
            { min: 700, max: 960, verified: true, family: "psfree", target: "run_psfree.html" },
            { min: 1000, max: 1102, verified: true, family: "css", target: "run_css.html" }
        ],
        families: {
            psfree: { label: "PSFree + Lapse", cachePage: "cache_psfree.html", manifest: "psfree.manifest", cacheKey: "tayson_cache_psfree_build", cacheBuild: "20260829-PS1" },
            css: { label: "CSSFontFace + Lapse", cachePage: "cache_css.html", manifest: "css.manifest", cacheKey: "tayson_cache_css_build", cacheBuild: "20260829-C1" },
            lapse: { label: "Lapse", cachePage: "cache_lapse.html", manifest: "lapse.manifest", cacheKey: "tayson_cache_lapse_build", cacheBuild: "20260829-L3" },
            poops: { label: "Poops", cachePage: "cache_poops.html", manifest: "poops.manifest", cacheKey: "tayson_cache_poops_build", cacheBuild: "20260829-P3" }
        }
    };
    cfg.versionNumber = versionNumber;
    cfg.resolveRoute = function (version) {
        var exact = cfg.routes[version], num, i, rule;
        if (exact) return exact;
        num = versionNumber(version);
        if (num < 0) return null;
        for (i = 0; i < cfg.rangeRoutes.length; i++) {
            rule = cfg.rangeRoutes[i];
            if (num >= rule.min && num <= rule.max) {
                return { verified: rule.verified, family: rule.family, target: rule.target };
            }
        }
        return null;
    };
    window.TaysonHostConfig = cfg;
}());
