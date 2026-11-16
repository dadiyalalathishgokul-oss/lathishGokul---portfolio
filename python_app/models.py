"""Typed domain models for the Python portfolio engine."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True)
class SemesterScore:
    semester: int
    label: str
    sgpa: float
    max_scale: float = 10.0
    credits: int = 22
    focus: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class SkillArea:
    id: str
    title: str
    summary: str
    python_focus: str
    code_example: str
    tools: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class ProjectSpec:
    id: str
    index_label: str
    title: str
    category: str
    summary: str
    role: str
    image_path: str
    python_component: str
    highlights: list[str] = field(default_factory=list)
    stack: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class CertificationRecord:
    id: str
    title: str
    period: str
    issuer: str
    focus_topics: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class Profile:
    name: str
    headline: str
    degree: str
    university: str
    year_of_study: str
    location: str
    email: str
    about: str
    availability: str
    semesters: list[SemesterScore]
    skills: list[SkillArea]
    projects: list[ProjectSpec]
    certifications: list[CertificationRecord]

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "headline": self.headline,
            "degree": self.degree,
            "university": self.university,
            "year_of_study": self.year_of_study,
            "location": self.location,
            "email": self.email,
            "about": self.about,
            "availability": self.availability,
            "semesters": [s.to_dict() for s in self.semesters],
            "skills": [sk.to_dict() for sk in self.skills],
            "projects": [p.to_dict() for p in self.projects],
            "certifications": [c.to_dict() for c in self.certifications],
        }


@dataclass(frozen=True)
class AlgorithmRunResult:
    algorithm_id: str
    title: str
    complexity_time: str
    complexity_space: str
    elapsed_microseconds: float
    inputs: dict[str, Any]
    output: Any
    trace: list[str]
    ast_summary: dict[str, int]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class InquiryRecord:
    id: int
    sender_name: str
    sender_email: str
    organization: str
    inquiry_type: str
    message: str
    created_at: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
