#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOST = ROOT / "host"

ERRORS: list[str] = []
WARNINGS: list[str] = []

GOLDHEN_VERSION = "2.4b18.9"
GOLDHEN_SHA256 = "ab1849d66816a9f4a3d155b06b51cdc5eb07a7fc5bd4333c90e3af74f802b2b2"


def fail(message: str) -> None:
    ERRORS.append(message)


def warn(message: str) -> None:
    WARNINGS.append(message)


def read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception as exc:
        fail(f"Cannot read {path.relative_to(ROOT)}: {exc}")
        return ""


def clean_local_ref(ref: str) -> str | None:
    ref = ref.strip()
    if not ref or ref.startswith(("#", "http://", "https://", "data:", "javascript:", "mailto:")):
        return None
    ref = ref.split("#", 1)[0].split("?", 1)[0]
    return ref or None


class LocalRefParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.refs: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs):
        attrs = dict(attrs)
        for attr in ("src", "href", "manifest"):
            value = attrs.get(attr)
            if value:
                self.refs.append((attr, value))


def validate_html_refs() -> None:
    for html in HOST.glob("*.html"):
        parser = LocalRefParser()
        try:
            parser.feed(read(html))
        except Exception as exc:
            fail(f"HTML parse error in {html.name}: {exc}")
            continue

        for attr, raw in parser.refs:
            ref = clean_local_ref(raw)
            if ref is None:
                continue
            target = (html.parent / ref).resolve()
            try:
                target.relative_to(ROOT.resolve())
            except ValueError:
                fail(f"{html.name}: {attr} escapes repository root: {raw}")
                continue
            if not target.exists():
                fail(f"{html.name}: missing local {attr} target: {raw}")


def manifest_entries(text: str) -> list[str]:
    entries: list[str] = []
    in_cache = False

    for raw in text.splitlines():
        line = raw.strip()
        if line == "CACHE:":
            in_cache = True
            continue
        if line in {"NETWORK:", "FALLBACK:"}:
            in_cache = False
            continue
        if not in_cache or not line or line.startswith("#"):
            continue
        entries.append(line)

    return entries


def validate_manifests() -> dict[str, str]:
    manifests = {
        "psfree": HOST / "psfree.manifest",
        "css": HOST / "css.manifest",
        "lapse": HOST / "lapse.manifest",
        "poops": HOST / "poops.manifest",
        "shell": HOST / "slopkit.manifest",
        "legacy_shell": HOST / "cache.appcache",
    }

    builds: dict[str, str] = {}

    for name, path in manifests.items():
        text = read(path)
        m = re.search(r"20\d{6}-[A-Z0-9]+", text)
        if not m:
            fail(f"{path.name}: build identifier missing")
        else:
            builds[name] = m.group(0)

        entries = manifest_entries(text)
        if not entries:
            fail(f"{path.name}: CACHE section is empty")

        seen: set[str] = set()
        for entry in entries:
            normalized = entry.split("?", 1)[0]
            if "\\" in entry:
                fail(f"{path.name}: backslash path is not portable: {entry}")
            if normalized in seen:
                warn(f"{path.name}: duplicate cache entry: {entry}")
            seen.add(normalized)
            if not (HOST / normalized).exists():
                fail(f"{path.name}: missing cached file: {entry}")

        if "NETWORK:\n*" not in text.replace("\r\n", "\n"):
            fail(f"{path.name}: NETWORK:* fallback missing")

    if builds.get("shell") != builds.get("legacy_shell"):
        fail("slopkit.manifest and cache.appcache shell build identifiers differ")

    return builds


def validate_config(builds: dict[str, str]) -> None:
    text = read(HOST / "host-config.js")

    release = re.search(r'release:\s*"([^"]+)"', text)
    if not release:
        fail("host-config.js: release missing")

    if f'version: "{GOLDHEN_VERSION}"' not in text:
        fail(f"host-config.js: GoldHEN version must remain {GOLDHEN_VERSION}")
    if f'sha256: "{GOLDHEN_SHA256}"' not in text:
        fail("host-config.js: GoldHEN SHA-256 metadata is missing or incorrect")

    expected = {
        "psfree": re.search(r'cacheKey:\s*"tayson_cache_psfree_build".*?cacheBuild:\s*"([^"]+)"', text, re.S),
        "css": re.search(r'cacheKey:\s*"tayson_cache_css_build".*?cacheBuild:\s*"([^"]+)"', text, re.S),
        "lapse": re.search(r'cacheKey:\s*"tayson_cache_lapse_build".*?cacheBuild:\s*"([^"]+)"', text, re.S),
        "poops": re.search(r'cacheKey:\s*"tayson_cache_poops_build".*?cacheBuild:\s*"([^"]+)"', text, re.S),
    }

    for family, match in expected.items():
        if not match:
            fail(f"host-config.js: cacheBuild missing for {family}")
            continue
        value = match.group(1)
        if builds.get(family) != value:
            fail(f"{family}: config build {value} != manifest build {builds.get(family)}")

    required_fragments = [
        ('PSFree range 7.00-9.60', 'min: 700, max: 960'),
        ('CSS range 10.00-11.02', 'min: 1000, max: 1102'),
        ('12.00 verified', '"12.00": { verified: true'),
        ('12.02 verified', '"12.02": { verified: true'),
        ('12.50 verified', '"12.50": { verified: true'),
        ('12.52 verified', '"12.52": { verified: true'),
        ('13.00 verified', '"13.00": { verified: true'),
    ]

    for label, fragment in required_fragments:
        if fragment not in text:
            fail(f"host-config.js: expected route missing: {label}")


def validate_vendor_metadata() -> None:
    required = [
        HOST / "vendor/psfree/LICENSE-AGPL-3.0",
        HOST / "vendor/psfree/UPSTREAM-COMMIT.txt",
        HOST / "vendor/css/LICENSE-MIT",
        HOST / "vendor/css/UPSTREAM-COMMIT.txt",
    ]
    for path in required:
        if not path.exists():
            fail(f"Missing vendor provenance file: {path.relative_to(ROOT)}")

    expected_commits = {
        HOST / "vendor/psfree/UPSTREAM-COMMIT.txt": "08ecf038c94aa99b56e46c9f32e2e486f83656b6",
        HOST / "vendor/css/UPSTREAM-COMMIT.txt": "221baa6e7349b96a6fd299808a25a4178e47741c",
    }
    for path, expected in expected_commits.items():
        if path.exists() and read(path).strip() != expected:
            fail(f"{path.relative_to(ROOT)}: upstream commit changed unexpectedly")


def validate_goldhen_payloads() -> None:
    payloads = [
        HOST / "payload.bin",
        HOST / "vendor/psfree/payload.bin",
        HOST / "vendor/css/src/payload.bin",
    ]

    for path in payloads:
        if not path.exists():
            fail(f"Missing GoldHEN {GOLDHEN_VERSION} payload: {path.relative_to(ROOT)}")
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest != GOLDHEN_SHA256:
            fail(
                f"{path.relative_to(ROOT)}: expected GoldHEN {GOLDHEN_VERSION} "
                f"SHA-256 {GOLDHEN_SHA256}, got {digest}"
            )

    for path in HOST.rglob("*"):
        if path.is_file() and path.suffix.lower() in {".html", ".js", ".manifest", ".appcache"}:
            if "GoldHEN v2.4b18.10" in read(path):
                fail(f"{path.relative_to(ROOT)}: GoldHEN v2.4b18.10 reference must not return")


def validate_dynamic_paths() -> None:
    checks = {
        HOST / "vendor/css/src/main.js": [
            'load_script(`src/',
            'fetch(`src/',
            'load_script("src/',
            'fetch("src/',
        ],
        HOST / "vendor/css/src/workers.js": ['new Worker("src/'],
    }

    for path, forbidden in checks.items():
        text = read(path)
        for token in forbidden:
            if token in text:
                fail(f"{path.relative_to(ROOT)} still contains unresolved relative path: {token}")

    for path in (HOST / "vendor/psfree/lapse/ps4").glob("*.mjs"):
        text = read(path)
        if 'patch_elf_loc = "./kpatch/' in text:
            fail(f"{path.relative_to(ROOT)} still points to ./kpatch/")


def validate_low_memory_runtime() -> None:
    config = read(HOST / "host-config.js")
    if 'runtimeProfile: "low-memory"' not in config:
        fail("host-config.js: low-memory runtime profile is not enabled")

    index = read(HOST / "index.html")
    for token in ('id="state"', 'id="console"', 'id="out"', 'role="log"'):
        if token not in index:
            fail(f"index.html: required single-page runtime element missing: {token}")

    router = read(HOST / "router.js")
    for token in (
        "TAYSON_CACHE_READY:",
        "TAYSON_CACHE_PROGRESS:",
        'document.createElement("iframe")',
        "startExploit",
    ):
        if token not in router:
            fail(f"router.js: required single-page runtime behavior missing: {token}")

    if "location.replace(route.target)" in router or "location.replace(family.cachePage)" in router:
        fail("router.js: active flow must not navigate to a second runtime/cache page")

    if "run_" in config:
        fail("host-config.js: active firmware routes must run inside index.html")

    for manifest_name in ("psfree.manifest", "css.manifest", "lapse.manifest", "poops.manifest"):
        if "run_" in read(HOST / manifest_name):
            fail(f"{manifest_name}: obsolete runner page remains in active cache")

    self_test = read(HOST / "self-test.html")
    if "function runNext()" not in self_test:
        fail("self-test.html: sequential low-memory checker is missing")


def main() -> int:
    if not HOST.exists():
        fail("host directory not found")
    else:
        builds = validate_manifests()
        validate_config(builds)
        validate_html_refs()
        validate_vendor_metadata()
        validate_goldhen_payloads()
        validate_dynamic_paths()
        validate_low_memory_runtime()

    for message in WARNINGS:
        print(f"WARNING: {message}")

    if ERRORS:
        for message in ERRORS:
            print(f"ERROR: {message}", file=sys.stderr)
        print(f"Host validation failed with {len(ERRORS)} error(s).", file=sys.stderr)
        return 1

    print("Host validation passed.")
    print(
        "Validated manifests, cache builds, routes, HTML refs, GoldHEN payloads, "
        "vendor provenance and dynamic paths."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
