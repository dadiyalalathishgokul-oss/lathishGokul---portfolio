"""Dynamic Markdown and structured text resume generator in Python."""

from __future__ import annotations

from python_app.gpa_analytics import summarize_academic_progression
from python_app.models import Profile
from python_app.portfolio_data import PORTFOLIO_PROFILE


def generate_markdown_resume(profile: Profile = PORTFOLIO_PROFILE) -> str:
    """Render a clean, ATS-friendly Markdown resume from the Python profile model."""
    academics = summarize_academic_progression(profile.semesters)

    lines: list[str] = [
        f"# {profile.name}",
        "",
        f"**{profile.degree}** · {profile.university} ({profile.year_of_study})",
        f"{profile.location} · {profile.email}",
        "",
        "## Objective",
        profile.about,
        "",
        "## Education",
        f"- **{profile.university}** — {profile.degree} ({profile.year_of_study})",
    ]

    for sem in profile.semesters:
        lines.append(f"  - {sem.label}: **{sem.sgpa} / {sem.max_scale:.0f}** — {sem.focus}")

    lines.extend(
        [
            f"  - Cumulative GPA: **{academics['current_cgpa']} / 10** "
            f"(+{academics['semester_delta']} improvement across semesters)",
            "",
            "## Technical Skills",
        ]
    )

    for skill in profile.skills:
        tools = ", ".join(skill.tools)
        lines.append(f"- **{skill.title}**: {skill.summary} ({tools})")

    lines.extend(["", "## Projects"])
    for proj in profile.projects:
        lines.extend(
            [
                f"### {proj.title} ({proj.category})",
                proj.summary,
                f"- {proj.role}",
                f"- Stack: {', '.join(proj.stack)}",
                "",
            ]
        )

    lines.append("## Certifications")
    for cert in profile.certifications:
        lines.append(f"- **{cert.title}** ({cert.period})")
        for topic in cert.focus_topics:
            lines.append(f"  - {topic}")

    lines.append("")
    return "\n".join(lines)
