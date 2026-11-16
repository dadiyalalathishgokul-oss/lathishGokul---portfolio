"""Standalone Python 3 HTTP server powering all portfolio APIs and SSR fallback."""

from __future__ import annotations

import html
import json
import os
import platform
import sys
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import parse_qs, urlparse

from python_app.contact_store import count_inquiries, save_inquiry
from python_app.dsa_engine import (
    compute_repository_language_stats,
    list_algorithms,
    run_algorithm,
    solve_jain_transit_route,
)
from python_app.gpa_analytics import forecast_target_cgpa, summarize_academic_progression
from python_app.portfolio_data import JAIN_TRANSIT_GRAPH, PORTFOLIO_PROFILE
from python_app.resume_exporter import generate_markdown_resume


def build_portfolio_payload() -> dict[str, Any]:
    """Assemble full portfolio response from Python models and analytics."""
    academics = summarize_academic_progression(PORTFOLIO_PROFILE.semesters)
    default_forecast = forecast_target_cgpa(PORTFOLIO_PROFILE.semesters, target_cgpa=8.5)
    language_stats = compute_repository_language_stats()
    return {
        "profile": PORTFOLIO_PROFILE.to_dict(),
        "academic_summary": academics,
        "default_forecast": default_forecast,
        "transit_stops": sorted(JAIN_TRANSIT_GRAPH.keys()),
        "language_stats": language_stats,
        "inquiries_count": count_inquiries(),
        "runtime": {
            "language": "Python",
            "version": platform.python_version(),
            "implementation": platform.python_implementation(),
        },
    }


def render_standalone_html() -> str:
    """Render an accessible server-side HTML view when Python runs standalone."""
    p = PORTFOLIO_PROFILE
    academics = summarize_academic_progression(p.semesters)
    projects_html = "\n".join(
        f"<article><h3>{html.escape(proj.index_label)}</h3>"
        f"<p>{html.escape(proj.summary)}</p>"
        f"<p><em>{html.escape(proj.role)}</em></p></article>"
        for proj in p.projects
    )
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>{html.escape(p.name)} — Python Portfolio</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {{ font-family: system-ui, sans-serif; max-width: 54rem; margin: 3rem auto; padding: 0 1.5rem; color: #13242b; background: #f4f7f6; line-height: 1.6; }}
    h1 {{ font-size: 2.5rem; margin-bottom: .5rem; }}
    a {{ color: #0b6b62; }}
    section {{ border-top: 1px solid #c3d3ce; padding: 1.5rem 0; }}
  </style>
</head>
<body>
  <header>
    <h1>{html.escape(p.name)}</h1>
    <p>{html.escape(p.headline)}</p>
    <p>{html.escape(p.location)} · <a href="mailto:{html.escape(p.email)}">{html.escape(p.email)}</a></p>
  </header>
  <section>
    <h2>About</h2>
    <p>{html.escape(p.about)}</p>
  </section>
  <section>
    <h2>Education &amp; CGPA</h2>
    <p>{html.escape(p.university)} — {html.escape(p.degree)} ({html.escape(p.year_of_study)})</p>
    <p>Current CGPA: {academics['current_cgpa']} / 10 (Growth: +{academics['semester_delta']})</p>
  </section>
  <section>
    <h2>Projects</h2>
    {projects_html}
  </section>
</body>
</html>"""


class PortfolioRequestHandler(BaseHTTPRequestHandler):
    """Thread-safe JSON & HTML request handler for the Python portfolio service."""

    server_version = "LathishPythonPortfolio/1.0"

    def log_message(self, format: str, *args: Any) -> None:
        # Keep stdout clean while still logging errors when needed
        if args and str(args[1]).startswith("5"):
            sys.stderr.write(f"[python-api] {format % args}\n")

    def _send_json(self, payload: Any, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0 or length > 65536:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/api/py/health":
            self._send_json({"ok": True, "python_version": platform.python_version()})
            return

        if path == "/api/py/portfolio":
            self._send_json(build_portfolio_payload())
            return

        if path == "/api/py/language-stats":
            self._send_json(compute_repository_language_stats())
            return

        if path == "/api/py/dsa":
            self._send_json({"algorithms": list_algorithms()})
            return

        if path == "/api/py/transit-sim":
            start = query.get("start", ["Main Gate"])[0]
            destination = query.get("destination", ["AI & ML Lab"])[0]
            self._send_json(solve_jain_transit_route(start, destination))
            return

        if path == "/api/py/gpa-forecast":
            try:
                target = float(query.get("target", ["8.5"])[0])
                total_sems = int(query.get("semesters", ["8"])[0])
            except ValueError:
                self._send_json({"error": "Invalid numeric target or semesters."}, HTTPStatus.BAD_REQUEST)
                return
            self._send_json(forecast_target_cgpa(PORTFOLIO_PROFILE.semesters, target, total_sems))
            return

        if path == "/api/py/resume":
            md_bytes = generate_markdown_resume().encode("utf-8")
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/markdown; charset=utf-8")
            self.send_header(
                "Content-Disposition",
                'attachment; filename="Dadiyala_Lathish_Gokul_Resume.md"',
            )
            self.send_header("Content-Length", str(len(md_bytes)))
            self.end_headers()
            self.wfile.write(md_bytes)
            return

        if path == "/":
            html_bytes = render_standalone_html().encode("utf-8")
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(html_bytes)))
            self.end_headers()
            self.wfile.write(html_bytes)
            return

        self._send_json({"error": f"Route '{path}' not found"}, HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path

        try:
            body = self._read_json_body()
        except (ValueError, json.JSONDecodeError):
            self._send_json({"error": "Malformed JSON request body."}, HTTPStatus.BAD_REQUEST)
            return

        if path == "/api/py/dsa/run":
            algo_id = str(body.get("algorithm_id", "bus_bfs"))
            inputs = body.get("inputs") if isinstance(body.get("inputs"), dict) else {}
            try:
                result = run_algorithm(algo_id, inputs)
            except (KeyError, ValueError, TypeError) as exc:
                self._send_json({"error": str(exc)}, HTTPStatus.BAD_REQUEST)
                return
            self._send_json(result.to_dict())
            return

        if path == "/api/py/contact":
            try:
                saved = save_inquiry(
                    sender_name=str(body.get("name", "")),
                    sender_email=str(body.get("email", "")),
                    organization=str(body.get("organization", "")),
                    inquiry_type=str(body.get("inquiry_type", "Internship")),
                    message=str(body.get("message", "")),
                )
            except ValueError as exc:
                self._send_json({"error": str(exc)}, HTTPStatus.BAD_REQUEST)
                return

            self._send_json(
                {
                    "ok": True,
                    "receipt": {
                        "id": saved.id,
                        "created_at": saved.created_at,
                        "inquiry_type": saved.inquiry_type,
                    },
                    "total_inquiries": count_inquiries(),
                },
                HTTPStatus.CREATED,
            )
            return

        self._send_json({"error": f"Route '{path}' not found"}, HTTPStatus.NOT_FOUND)


def run_server() -> None:
    host = os.environ.get("PYTHON_HOST", "127.0.0.1")
    port = int(os.environ.get("PYTHON_PORT", "8765"))
    server = ThreadingHTTPServer((host, port), PortfolioRequestHandler)
    print(f"Python portfolio backend listening on http://{host}:{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    run_server()
