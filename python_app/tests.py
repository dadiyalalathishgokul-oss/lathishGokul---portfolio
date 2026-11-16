"""Unit tests verifying portfolio parity and 40-50% Python codebase share."""

from __future__ import annotations

import unittest

from python_app.portfolio_data import PORTFOLIO_DATA, compute_language_stats
from python_app.site_renderer import render_portfolio_html


class PortfolioVerificationTests(unittest.TestCase):
    def test_portfolio_content_matches_original(self) -> None:
        payload = PORTFOLIO_DATA.to_dict()
        self.assertEqual(payload["name"], "Dadiyala Lathish Gokul")
        self.assertEqual(payload["email"], "dadiyalalathishgokul@gmail.com")
        self.assertEqual(len(payload["semesters"]), 2)
        self.assertEqual(payload["semesters"][0]["cgpa"], 7.05)
        self.assertEqual(payload["semesters"][1]["cgpa"], 7.862)
        project_titles = [p["title"] for p in payload["projects"]]
        self.assertEqual(project_titles, ["Jain Transit", "Wonderla Sentinel"])

    def test_rendered_html_contains_all_sections(self) -> None:
        html_doc = render_portfolio_html(PORTFOLIO_DATA)
        for heading in (
            "About me",
            "Education",
            "Skills",
            "Projects",
            "Certifications",
            "Contact",
        ):
            self.assertIn(heading, html_doc)

    def test_python_percentage_within_40_to_50_range(self) -> None:
        stats = compute_language_stats()
        pct = stats["python_percentage"]
        self.assertGreaterEqual(pct, 40.0, f"Python share too low: {pct}%")
        self.assertLessEqual(pct, 50.0, f"Python share too high: {pct}%")


if __name__ == "__main__":
    unittest.main()
