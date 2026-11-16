"""Portfolio data source and repository language composition calculator."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from python_app.models import (
    CertificationEntry,
    PortfolioDocument,
    ProjectEntry,
    SemesterEntry,
)

PORTFOLIO_DATA = PortfolioDocument(
    name="Dadiyala Lathish Gokul",
    lead=(
        "Second-year B.Tech student in Computer Science and Engineering "
        "(AI & ML) at Jain University."
    ),
    location="Tirupati, Andhra Pradesh",
    email="dadiyalalathishgokul@gmail.com",
    about=(
        "I’m looking for a fresher role or internship where I can apply my "
        "programming, data structures and algorithms, and project experience. "
        "I like solving problems, learning new things, and contributing to a team."
    ),
    university="Jain University",
    degree_summary="B.Tech, Computer Science and Engineering (AI & ML), currently in 2nd year",
    semesters=[
        SemesterEntry(label="Semester 1", cgpa=7.05, width_percent=70.5),
        SemesterEntry(label="Semester 2", cgpa=7.862, width_percent=78.62),
    ],
    skills=[
        "Data structures and algorithms",
        "Back-end and database development",
        "User interface design and development",
    ],
    projects=[
        ProjectEntry(
            title="Jain Transit",
            description=(
                "A smart transportation website that helps students track college "
                "buses, view live bus timings, and find important transit information "
                "for easier travel."
            ),
            role="My role: designed and contributed to the back end and the database.",
        ),
        ProjectEntry(
            title="Wonderla Sentinel",
            description=(
                "An interactive, AI-powered experimental website that explores creative "
                "ideas, artificial intelligence, and new digital experiences."
            ),
            role=(
                "My role: contributed to design and development, focusing on the user "
                "interface, interactive features, and a user-friendly experience."
            ),
        ),
    ],
    certification=CertificationEntry(
        title="Data Structures and Algorithms (DSA) course and certificate",
        period="1 May 2025 – 7 August 2025",
    ),
    contact_text="Open to internships and entry-level roles.",
)


def compute_language_stats(root_dir: str | Path | None = None) -> dict[str, Any]:
    """Compute exact source-byte language percentages across the repository."""
    base = Path(root_dir or os.getcwd())
    ext_map = {
        ".py": "Python",
        ".ts": "TypeScript",
        ".tsx": "TypeScript",
        ".css": "CSS",
        ".html": "HTML",
    }
    ignored_dirs = {"node_modules", "dist", ".git", "__pycache__", ".aistudio"}
    totals: dict[str, dict[str, int]] = {
        lang: {"bytes": 0, "lines": 0, "files": 0}
        for lang in ("Python", "TypeScript", "CSS", "HTML")
    }

    for current_root, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.startswith(".")]
        for fname in files:
            ext = Path(fname).suffix.lower()
            lang = ext_map.get(ext)
            if not lang:
                continue
            fpath = Path(current_root) / fname
            try:
                content = fpath.read_text(encoding="utf-8")
            except OSError:
                continue
            totals[lang]["bytes"] += len(content.encode("utf-8"))
            totals[lang]["lines"] += len(content.splitlines())
            totals[lang]["files"] += 1

    total_bytes = sum(item["bytes"] for item in totals.values()) or 1
    languages = [
        {
            "language": lang,
            "bytes": stats["bytes"],
            "lines": stats["lines"],
            "files": stats["files"],
            "percentage": round((stats["bytes"] / total_bytes) * 100.0, 1),
        }
        for lang, stats in totals.items()
    ]
    languages.sort(key=lambda entry: entry["bytes"], reverse=True)
    python_pct = next((item["percentage"] for item in languages if item["language"] == "Python"), 0.0)
    return {
        "total_bytes": total_bytes,
        "python_percentage": python_pct,
        "languages": languages,
    }
