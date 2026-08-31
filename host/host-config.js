/* Tayson PS4 webkit - central host configuration */
(function () {
    "use strict";
    function versionNumber(version) {
        var m = String(version || "").match(/^(\d+)\.(\d+)$/);
        if (!m) return -1;
        return (parseInt(m[1], 10) * 100) + parseInt(m[2], 10);
    }
    var cfg = {
        release: "20260831-20",
        maxRepairAttempts: 2,
        runtimeProfile: "low-memory",
        payload: {
            label: "GoldHEN v2.4b18.9",
            version: "2.4b18.9",
            bytes: 291808,
            sha256: "ab1849d66816a9f4a3d155b06b51cdc5eb07a7fc5bd4333c90e3af74f802b2b2"
        },
        routes: {
            "11.50": { verified: true, family: "lapse", target: "run_lapse.html?bug=lapse&v=20260831-20" },
            "12.00": { verified: true, family: "lapse", target: "run_lapse.html?bug=lapse&v=20260831-20" },
            "12.02": { verified: true, family: "lapse", target: "run_lapse.html?bug=lapse&v=20260831-20" },
            "12.50": { verified: true, family: "poops", target: "run_poops.html?bug=poops&v=20260831-20" },
            "12.52": { verified: true, family: "poops", target: "run_poops.html?bug=poops&v=20260831-20" },
            "13.00": { verified: true, family: "poops", target: "run_poops.html?bug=poops&v=20260831-20" }
        },
        rangeRoutes: [
            { min: 700, max: 960, verified: true, family: "psfree", target: "run_psfree.html?v=20260831-20" },
            { min: 1000, max: 1102, verified: true, family: "css", target: "run_css.html?v=20260831-20" }
        ],
        families: {
            psfree: { label: "PSFree + Lapse", cachePage: "cache_psfree.html?v=20260831-20", manifest: "psfree.manifest", cacheKey: "tayson_cache_psfree_build", cacheBuild: "20260831-PS8" },
            css: { label: "CSSFontFace + Lapse", cachePage: "cache_css.html?v=20260831-20", manifest: "css.manifest", cacheKey: "tayson_cache_css_build", cacheBuild: "20260831-C8" },
            lapse: { label: "Lapse", cachePage: "cache_lapse.html?v=20260831-20", manifest: "lapse.manifest", cacheKey: "tayson_cache_lapse_build", cacheBuild: "20260831-L10" },
            poops: { label: "Poops", cachePage: "cache_poops.html?v=20260831-20", manifest: "poops.manifest", cacheKey: "tayson_cache_poops_build", cacheBuild: "20260831-P10" }
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
