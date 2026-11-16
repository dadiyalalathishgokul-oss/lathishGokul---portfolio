"""Typed dataclasses representing Dadiyala Lathish Gokul's portfolio."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True)
class SemesterEntry:
    label: str
    cgpa: float
    width_percent: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "label": self.label,
            "cgpa": self.cgpa,
            "widthPercent": self.width_percent,
        }


@dataclass(frozen=True)
class ProjectEntry:
    title: str
    description: str
    role: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class CertificationEntry:
    title: str
    period: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class PortfolioDocument:
    name: str
    lead: str
    location: str
    email: str
    about: str
    university: str
    degree_summary: str
    semesters: list[SemesterEntry] = field(default_factory=list)
    skills: list[str] = field(default_factory=list)
    projects: list[ProjectEntry] = field(default_factory=list)
    certification: CertificationEntry | None = None
    contact_text: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "lead": self.lead,
            "location": self.location,
            "email": self.email,
            "about": self.about,
            "university": self.university,
            "degreeSummary": self.degree_summary,
            "semesters": [sem.to_dict() for sem in self.semesters],
            "skills": list(self.skills),
            "projects": [proj.to_dict() for proj in self.projects],
            "certification": self.certification.to_dict() if self.certification else None,
            "contactText": self.contact_text,
        }
