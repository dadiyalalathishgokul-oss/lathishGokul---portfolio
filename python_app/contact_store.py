"""SQLite3 persistence layer for recruiter and internship inquiries."""

from __future__ import annotations

import os
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from python_app.models import InquiryRecord

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
DEFAULT_DB_PATH = Path(os.environ.get("PORTFOLIO_DB_PATH", "/tmp/lathish_portfolio.db"))


def _connect(db_path: Path = DEFAULT_DB_PATH) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_name TEXT NOT NULL,
            sender_email TEXT NOT NULL,
            organization TEXT NOT NULL DEFAULT '',
            inquiry_type TEXT NOT NULL DEFAULT 'Internship',
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    return conn


def save_inquiry(
    sender_name: str,
    sender_email: str,
    organization: str,
    inquiry_type: str,
    message: str,
    db_path: Path = DEFAULT_DB_PATH,
) -> InquiryRecord:
    """Validate and persist a recruiter or collaboration message in SQLite."""
    name = sender_name.strip()
    email = sender_email.strip()
    org = organization.strip()
    kind = inquiry_type.strip() or "Internship"
    body = message.strip()

    if len(name) < 2:
        raise ValueError("Please provide your name (at least 2 characters).")
    if not EMAIL_RE.match(email):
        raise ValueError("Please provide a valid email address.")
    if len(body) < 10:
        raise ValueError("Please include a brief message (at least 10 characters).")

    created_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with _connect(db_path) as conn:
        cursor = conn.execute(
            """
            INSERT INTO inquiries (
                sender_name, sender_email, organization, inquiry_type, message, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (name[:100], email[:140], org[:120], kind[:40], body[:2000], created_at),
        )
        conn.commit()
        record_id = int(cursor.lastrowid or 0)

    return InquiryRecord(
        id=record_id,
        sender_name=name,
        sender_email=email,
        organization=org,
        inquiry_type=kind,
        message=body,
        created_at=created_at,
    )


def list_recent_inquiries(limit: int = 5, db_path: Path = DEFAULT_DB_PATH) -> list[InquiryRecord]:
    """Return recent inquiry count/metadata without exposing private sender emails."""
    with _connect(db_path) as conn:
        rows = conn.execute(
            """
            SELECT id, sender_name, sender_email, organization, inquiry_type, message, created_at
            FROM inquiries
            ORDER BY id DESC
            LIMIT ?
            """,
            (max(1, min(20, int(limit))),),
        ).fetchall()

    return [
        InquiryRecord(
            id=int(row["id"]),
            sender_name=str(row["sender_name"]),
            sender_email=str(row["sender_email"]),
            organization=str(row["organization"]),
            inquiry_type=str(row["inquiry_type"]),
            message=str(row["message"]),
            created_at=str(row["created_at"]),
        )
        for row in rows
    ]


def count_inquiries(db_path: Path = DEFAULT_DB_PATH) -> int:
    """Return total stored inquiries."""
    with _connect(db_path) as conn:
        row = conn.execute("SELECT COUNT(*) AS total FROM inquiries").fetchone()
    return int(row["total"]) if row else 0
