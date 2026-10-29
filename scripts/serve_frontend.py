#!/usr/bin/env python3
"""
FloodAI — SPA-Aware Development HTTP Server
Serves the frontend directory with proper SPA (Single Page Application) support.

For any URL path that maps to a client-side route (not a real file),
this server returns index.html instead of a 404, allowing the JavaScript
router to handle navigation.

Usage:
  python scripts/serve_frontend.py [port]
  python scripts/serve_frontend.py 3000   (default port)
"""

import sys
import os
import http.server
import socketserver
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000

# The frontend directory is one level up from this script's location
SCRIPT_DIR = Path(__file__).parent
FRONTEND_DIR = SCRIPT_DIR.parent / "frontend"

# All known client-side route prefixes (must serve index.html, not 404)
SPA_PREFIXES = (
    "/admin", "/analyst", "/resident", "/home", "/login", "/signup",
    "/onboarding", "/landing", "/portal", "/command", "/map", "/predict",
    "/weather", "/dashboard", "/analytics", "/records", "/alerts",
    "/profile", "/settings", "/terms", "/privacy",
)


class SpaRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Serve index.html for all SPA routes; serve real files normally."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIR), **kwargs)

    def send_error(self, code, message=None, explain=None):
        """Intercept 404s for SPA routes and serve index.html instead."""
        if code == 404 and self._is_spa_route():
            self._serve_index()
            return
        super().send_error(code, message, explain)

    def do_GET(self):
        """Override GET to serve index.html for SPA routes."""
        path = self.path.split("?")[0].split("#")[0]  # strip query / fragment
        if path == "/" or path in SPA_PREFIXES or any(
            path.startswith(prefix + "/") for prefix in SPA_PREFIXES
        ):
            self._serve_index()
            return
        super().do_GET()

    def _is_spa_route(self):
        path = self.path.split("?")[0].split("#")[0]
        return path == "/" or path in SPA_PREFIXES or any(
            path.startswith(prefix + "/") for prefix in SPA_PREFIXES
        )

    def _serve_index(self):
        index_path = FRONTEND_DIR / "index.html"
        if not index_path.exists():
            self.send_error(404, "index.html not found")
            return
        content = index_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, format, *args):
        """Suppress routine logs for static assets to reduce noise."""
        if args and len(args) >= 2 and str(args[1]) in ("200", "304"):
            path = self.path.split("?")[0]
            if path.endswith((".js", ".css", ".ico", ".svg", ".woff", ".woff2", ".png")):
                return
        super().log_message(format, *args)


if __name__ == "__main__":
    os.chdir(FRONTEND_DIR)
    with socketserver.TCPServer(("", PORT), SpaRequestHandler) as httpd:
        print(f"[FloodAI Dev Server] Serving frontend at http://localhost:{PORT}")
        print(f"[FloodAI Dev Server] SPA route rewriting enabled (index.html fallback)")
        print(f"[FloodAI Dev Server] Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[FloodAI Dev Server] Stopped.")
