"""Python HTML renderer reproducing the exact portfolio-lathish.netlify.app layout."""

from __future__ import annotations

import html
from pathlib import Path

from python_app.models import PortfolioDocument
from python_app.portfolio_data import PORTFOLIO_DATA

def _load_stylesheet() -> str:
    css_path = Path("src/index.css")
    if css_path.exists():
        raw = css_path.read_text(encoding="utf-8")
        return raw.replace('@import "tailwindcss";', "").replace("main.portfolio-main ", "main ").replace("main.portfolio-main", "main")
    return "body{margin:0;font-family:sans-serif;background:#f4f7f6;color:#13242b}main{max-width:56rem;margin:0 auto;padding:4rem 1.5rem}"


def render_portfolio_html(doc: PortfolioDocument = PORTFOLIO_DATA) -> str:
    """Render the exact standalone HTML portfolio page in Python."""
    bars_html = "".join(
        f'<div class="bar"><span>{html.escape(s.label)}</span>'
        f'<div class="track"><div class="fill" style="width:{s.width_percent}%"></div></div>'
        f'<b>{s.cgpa}</b></div>'
        for s in doc.semesters
    )
    skills_html = "".join(f"<li>{html.escape(skill)}</li>" for skill in doc.skills)
    projects_html = "".join(
        f'<article class="project"><h3>{html.escape(proj.title)}</h3>'
        f'<p>{html.escape(proj.description)}</p>'
        f'<p class="role">{html.escape(proj.role)}</p></article>'
        for proj in doc.projects
    )
    cert_html = ""
    if doc.certification:
        cert_html = (
            f"<section><h2>Certifications</h2><div><p>"
            f"<strong>{html.escape(doc.certification.title)}</strong><br>"
            f"{html.escape(doc.certification.period)}</p></div></section>"
        )

    return (
        '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
        f"<title>{html.escape(doc.name)} – Portfolio</title>"
        '<link rel="preconnect" href="https://fonts.googleapis.com">'
        '<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">'
        f"<style>{_load_stylesheet()}</style></head><body><main>"
        f"<header><h1>{html.escape(doc.name)}</h1>"
        f'<p class="lead">{html.escape(doc.lead)}</p>'
        f'<div class="meta"><span>{html.escape(doc.location)}</span>'
        f'<a href="mailto:{html.escape(doc.email)}">{html.escape(doc.email)}</a></div></header>'
        f"<section><h2>About me</h2><div><p>{html.escape(doc.about)}</p></div></section>"
        f"<section><h2>Education</h2><div><p><strong>{html.escape(doc.university)}</strong><br>"
        f"{html.escape(doc.degree_summary)}</p>"
        f'<div class="bars" role="img" aria-label="CGPA rose from 7.05 in semester 1 to 7.862 in semester 2, out of 10">'
        f"{bars_html}</div></div></section>"
        f"<section><h2>Skills</h2><ul>{skills_html}</ul></section>"
        f"<section><h2>Projects</h2><div>{projects_html}</div></section>"
        f"{cert_html}"
        f"<section><h2>Contact</h2><div><p>{html.escape(doc.contact_text)} "
        f'<a href="mailto:{html.escape(doc.email)}">Email me</a>.</p></div></section>'
        "</main></body></html>"
    )


def export_static_html(output_path: str | Path = "dist/index.html") -> Path:
    """Write rendered HTML to disk for static hosting."""
    target = Path(output_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(render_portfolio_html(), encoding="utf-8")
    return target


if __name__ == "__main__":
    written = export_static_html()
    print(f"Exported static portfolio to {written}")
