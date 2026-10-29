"""Builds ./dist for Cloudflare Pages (static hosting).

  python build_static.py                          -> the app works on its own, saving to the browser (no accounts)
  python build_static.py https://mindease.onrender.com   -> /api/* is forwarded to your backend, so sign-in, sync and sharing work

Then upload the dist folder (about 30 files) to Cloudflare Pages.
"""
import shutil
import sys
from pathlib import Path

base = Path(__file__).resolve().parent
dist = base / "dist"
backend = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else ""

shutil.rmtree(dist, ignore_errors=True)
shutil.copytree(base / "static", dist, ignore=shutil.ignore_patterns(".DS_Store"))
shutil.copy(base / "templates" / "landing.html", dist / "index.html")
(dist / "app").mkdir()
shutil.copy(base / "templates" / "app.html", dist / "app" / "index.html")

(dist / "_headers").write_text(
    "/*\n"
    "  X-Content-Type-Options: nosniff\n"
    "  X-Frame-Options: DENY\n"
    "  Referrer-Policy: same-origin\n"
    "  Permissions-Policy: camera=(), microphone=(), geolocation=()\n"
    "  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
    "font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'\n"
    "/sw.js\n  Cache-Control: no-cache\n"
    "/manifest.webmanifest\n  Content-Type: application/manifest+json\n  Cache-Control: no-cache\n"
    "/api/*\n  Cache-Control: no-store\n"
)
if backend:
    (dist / "_redirects").write_text(f"/api/* {backend}/api/:splat 200\n")
n = sum(1 for p in dist.rglob("*") if p.is_file())
print(f"dist ready: {n} files" + (f", /api -> {backend}" if backend else ", no backend (guest mode)"))
