/* Tayson PS4 webkit - central host configuration */
(function () {
    "use strict";

    function versionNumber(version) {
        var m = String(version || "").match(/^(\d+)\.(\d+)$/);
        if (!m) return -1;
        return (parseInt(m[1], 10) * 100) + parseInt(m[2], 10);
    }

    var cfg = {
        release: "20260920-31",
        maxRepairAttempts: 2,
        runtimeProfile: "low-memory",

        payloadPreferenceKey: "tayson_goldhen_version",
        defaultPayloadVersion: "2.4b18.9",
        payloads: {
            "2.4b18.9": {
                label: "GoldHEN v2.4b18.9",
                version: "2.4b18.9",
                path: "/payloads/goldhen/goldhen-2.4b18.9.bin",
                bytes: 291808,
                sha256: "ab1849d66816a9f4a3d155b06b51cdc5eb07a7fc5bd4333c90e3af74f802b2b2",
                status: "recommended-local",
                experimental: false
            },
            "2.4b18.10": {
                label: "GoldHEN v2.4b18.10",
                version: "2.4b18.10",
                path: "/payloads/goldhen/goldhen-2.4b18.10.bin",
                bytes: 290016,
                sha256: "c6329401d1810e16c84e6474ac30977dbdc951987c10cdb559370de7d59db0b0",
                status: "experimental",
                experimental: true
            },
            "2.4b18.11": {
                label: "GoldHEN v2.4b18.11",
                version: "2.4b18.11",
                path: "/payloads/goldhen/goldhen-2.4b18.11.bin",
                bytes: 291072,
                sha256: "48d46667249330c9be48c96a2a3a2dab4464dababa8fcb3e38170c98caf3851f",
                status: "experimental",
                experimental: true
            }
        },

        /* Backward-compatible default payload metadata. */
        payload: {
            label: "GoldHEN v2.4b18.9",
            version: "2.4b18.9",
            path: "/payloads/goldhen/goldhen-2.4b18.9.bin",
            bytes: 291808,
            sha256: "ab1849d66816a9f4a3d155b06b51cdc5eb07a7fc5bd4333c90e3af74f802b2b2"
        },

        routes: {
            "11.50": { verified: true, family: "lapse" },
            "12.00": { verified: true, family: "lapse" },
            "12.02": { verified: true, family: "lapse" },
            "12.50": { verified: true, family: "poops" },
            "12.52": { verified: true, family: "poops" },
            "13.00": { verified: true, family: "poops" }
        },

        rangeRoutes: [
            { min: 700, max: 960, verified: true, family: "psfree" },
            { min: 1000, max: 1102, verified: true, family: "css" }
        ],

        families: {
            psfree: {
                label: "PSFree + Lapse",
                entry: "vendor/psfree/alert.mjs",
                cachePage: "cache_psfree.html?v=20260920-31",
                manifest: "psfree.manifest",
                cacheKey: "tayson_cache_psfree_build",
                cacheBuild: "20260920-PS11"
            },
            css: {
                label: "CSSFontFace + Lapse",
                entry: "vendor/css/src/main.js",
                cachePage: "cache_css.html?v=20260920-31",
                manifest: "css.manifest",
                cacheKey: "tayson_cache_css_build",
                cacheBuild: "20260920-C11"
            },
            lapse: {
                label: "Lapse",
                entry: "chain_lapse.js",
                cachePage: "cache_lapse.html?v=20260920-31",
                manifest: "lapse.manifest",
                cacheKey: "tayson_cache_lapse_build",
                cacheBuild: "20260920-L13"
            },
            poops: {
                label: "Poops",
                entry: "chain_poops.js",
                cachePage: "cache_poops.html?v=20260920-31",
                manifest: "poops.manifest",
                cacheKey: "tayson_cache_poops_build",
                cacheBuild: "20260920-P13"
            }
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
                return { verified: rule.verified, family: rule.family };
            }
        }
        return null;
    };

    cfg.hasPayload = function (version) {
        return !!(version && cfg.payloads &&
            Object.prototype.hasOwnProperty.call(cfg.payloads, version));
    };

    cfg.resolvePayload = function (version) {
        if (cfg.hasPayload(version)) return cfg.payloads[version];
        return cfg.payloads[cfg.defaultPayloadVersion] || cfg.payload;
    };

    window.TaysonHostConfig = cfg;
}());
