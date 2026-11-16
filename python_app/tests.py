"""Unit tests for the Python portfolio engine, GPA analytics, DSA lab, and SQLite store."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from python_app.contact_store import count_inquiries, list_recent_inquiries, save_inquiry
from python_app.dsa_engine import (
    compute_repository_language_stats,
    list_algorithms,
    run_algorithm,
    solve_jain_transit_route,
)
from python_app.gpa_analytics import forecast_target_cgpa, summarize_academic_progression
from python_app.portfolio_data import PORTFOLIO_PROFILE


class PortfolioEngineTests(unittest.TestCase):
    def test_academic_progression(self) -> None:
        summary = summarize_academic_progression(PORTFOLIO_PROFILE.semesters)
        self.assertGreater(summary["semester_delta"], 0.8)
        self.assertEqual(summary["completed_semesters"], 2)
        self.assertAlmostEqual(summary["current_cgpa"], 7.456, places=3)

    def test_gpa_forecast_reachable(self) -> None:
        forecast = forecast_target_cgpa(PORTFOLIO_PROFILE.semesters, target_cgpa=8.5, total_semesters=8)
        self.assertTrue(forecast["achievable"])
        self.assertEqual(len(forecast["trajectory"]), 8)
        self.assertGreater(forecast["required_sgpa_per_semester"], 8.5)

    def test_dsa_algorithms_execute(self) -> None:
        algos = list_algorithms()
        self.assertGreaterEqual(len(algos), 4)
        bs_res = run_algorithm("binary_search", {"nums": [10, 2, 8, 23], "target": 10})
        self.assertEqual(bs_res.output["found_index"], 2)
        bfs_res = run_algorithm("bus_bfs", {"start": "Main Gate", "destination": "AI & ML Lab"})
        self.assertGreaterEqual(bfs_res.output["hops"], 2)

    def test_jain_transit_dijkstra(self) -> None:
        route = solve_jain_transit_route("Main Gate", "AI & ML Lab")
        self.assertTrue(route["found"])
        self.assertEqual(route["path"][0], "Main Gate")
        self.assertEqual(route["path"][-1], "AI & ML Lab")
        self.assertGreater(route["total_minutes"], 0)

    def test_contact_store_roundtrip(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            db = Path(tmp) / "test_inquiries.db"
            saved = save_inquiry(
                sender_name="Ananya Rao",
                sender_email="ananya@example.com",
                organization="Bengaluru AI Labs",
                inquiry_type="Internship",
                message="Interested in discussing a summer Python & ML internship.",
                db_path=db,
            )
            self.assertEqual(saved.id, 1)
            self.assertEqual(count_inquiries(db_path=db), 1)
            recent = list_recent_inquiries(db_path=db)
            self.assertEqual(recent[0].sender_name, "Ananya Rao")

    def test_language_stats(self) -> None:
        stats = compute_repository_language_stats()
        self.assertGreater(stats["total_bytes"], 0)
        self.assertGreaterEqual(stats["python_percentage"], 40.0)
        self.assertLessEqual(stats["python_percentage"], 65.0)

    def test_resume_exporter(self) -> None:
        from python_app.resume_exporter import generate_markdown_resume

        md = generate_markdown_resume()
        self.assertIn("Dadiyala Lathish Gokul", md)
        self.assertIn("Jain Transit", md)
        self.assertIn("7.862", md)


if __name__ == "__main__":
    unittest.main()
