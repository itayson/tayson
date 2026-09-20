/* Tayson PS4 webkit - central host configuration */
(function () {
    "use strict";

    function versionNumber(version) {
        var m = String(version || "").match(/^(\d+)\.(\d+)$/);
        if (!m) return -1;
        return (parseInt(m[1], 10) * 100) + parseInt(m[2], 10);
    }

    var cfg = {
        release: "20260920-32",
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
            "13.00": { verified: true, family: "poops" },

            /*
             * polpNO-derived lab metadata. These routes are deliberately
             * recognized but locked: they do not enter the active offset table
             * and cannot auto-run until this host validates the required
             * WebKit/kernel data and patch blobs independently.
             */
            "13.02": {
                verified: false,
                experimental: true,
                runnable: false,
                family: "poops",
                validation: "partial-verified-upstream",
                aliasOf: "13.00",
                provenance: "mansoor0x/polpNO-use@39ed44c",
                reason: "Upstream shares 13.00 WebKit and supplies corrected kernel RVAs; the 13.02 patch path is not promoted on this host."
            },
            "13.04": {
                verified: false,
                experimental: true,
                runnable: false,
                family: "poops",
                validation: "incomplete-upstream",
                provenance: "mansoor0x/polpNO-use@39ed44c",
                reason: "Upstream still marks the WebKit anchor/complex gadgets and kernel RVAs incomplete or unverified."
            },
            "13.50": {
                verified: false,
                experimental: true,
                runnable: false,
                family: "poops",
                validation: "incomplete-upstream",
                aliasOf: "13.04",
                provenance: "mansoor0x/polpNO-use@39ed44c",
                reason: "Upstream treats 13.50 as a 13.04-derived lab alias with unverified kernel data."
            },
            "13.52": {
                verified: false,
                experimental: true,
                runnable: false,
                family: "poops",
                validation: "incomplete-upstream",
                aliasOf: "13.50",
                provenance: "mansoor0x/polpNO-use@39ed44c",
                reason: "Upstream treats 13.52 as a lab alias; WebKit/kernel data and patching remain unverified."
            }
        },

        rangeRoutes: [
            { min: 700, max: 960, verified: true, family: "psfree" },
            { min: 1000, max: 1102, verified: true, family: "css" }
        ],

        families: {
            psfree: {
                label: "PSFree + Lapse",
                entry: "vendor/psfree/alert.mjs",
                cachePage: "cache_psfree.html?v=20260920-32",
                manifest: "psfree.manifest",
                cacheKey: "tayson_cache_psfree_build",
                cacheBuild: "20260920-PS12"
            },
            css: {
                label: "CSSFontFace + Lapse",
                entry: "vendor/css/src/main.js",
                cachePage: "cache_css.html?v=20260920-32",
                manifest: "css.manifest",
                cacheKey: "tayson_cache_css_build",
                cacheBuild: "20260920-C12"
            },
            lapse: {
                label: "Lapse",
                entry: "chain_lapse.js",
                cachePage: "cache_lapse.html?v=20260920-32",
                manifest: "lapse.manifest",
                cacheKey: "tayson_cache_lapse_build",
                cacheBuild: "20260920-L14"
            },
            poops: {
                label: "Poops",
                entry: "chain_poops.js",
                cachePage: "cache_poops.html?v=20260920-32",
                manifest: "poops.manifest",
                cacheKey: "tayson_cache_poops_build",
                cacheBuild: "20260920-P14"
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

    cfg.routeTier = function (route) {
        if (!route) return "unsupported";
        if (route.verified) return "verified";
        if (route.experimental && route.runnable) return "experimental";
        if (route.experimental) return "lab-locked";
        return "recognized";
    };

    window.TaysonHostConfig = cfg;
}());
