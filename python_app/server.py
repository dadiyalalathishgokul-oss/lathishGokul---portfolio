"""Python 3 HTTP server serving portfolio JSON APIs and standalone HTML."""

from __future__ import annotations

import json
import os
import platform
import sys
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import urlparse

from python_app.portfolio_data import PORTFOLIO_DATA, compute_language_stats
from python_app.site_renderer import render_portfolio_html


class PortfolioHandler(BaseHTTPRequestHandler):
    """Serves exact portfolio data, language stats, and standalone HTML."""

    server_version = "LathishPythonPortfolio/1.0"

    def log_message(self, format: str, *args: Any) -> None:
        if args and str(args[1]).startswith("5"):
            sys.stderr.write(f"[python] {format % args}\n")

    def _send_json(self, payload: Any, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path

        if path == "/api/py/health":
            self._send_json({"ok": True, "python": platform.python_version()})
            return

        if path == "/api/py/portfolio":
            self._send_json(PORTFOLIO_DATA.to_dict())
            return

        if path == "/api/py/language-stats":
            self._send_json(compute_language_stats())
            return

        if path == "/":
            html_bytes = render_portfolio_html(PORTFOLIO_DATA).encode("utf-8")
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(html_bytes)))
            self.end_headers()
            self.wfile.write(html_bytes)
            return

        self._send_json({"error": f"Route '{path}' not found"}, HTTPStatus.NOT_FOUND)


def run_server() -> None:
    host = os.environ.get("PYTHON_HOST", "127.0.0.1")
    port = int(os.environ.get("PYTHON_PORT", "8765"))
    server = ThreadingHTTPServer((host, port), PortfolioHandler)
    print(f"Python portfolio backend listening on http://{host}:{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    run_server()
