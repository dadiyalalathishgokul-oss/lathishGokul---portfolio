"""Command-line utility for inspecting and exporting the Python portfolio."""

from __future__ import annotations

import argparse
import json
import sys

from python_app.dsa_engine import (
    compute_repository_language_stats,
    run_algorithm,
    solve_jain_transit_route,
)
from python_app.gpa_analytics import forecast_target_cgpa, summarize_academic_progression
from python_app.portfolio_data import PORTFOLIO_PROFILE
from python_app.resume_exporter import generate_markdown_resume


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python3 -m python_app.cli",
        description="CLI tools for Dadiyala Lathish Gokul's Python portfolio engine.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("resume", help="Print ATS-ready Markdown resume to stdout.")
    sub.add_parser("stats", help="Print live repository language composition JSON.")

    gpa_cmd = sub.add_parser("gpa", help="Forecast required SGPA for a target CGPA.")
    gpa_cmd.add_argument("--target", type=float, default=8.5, help="Target graduation CGPA")
    gpa_cmd.add_argument("--semesters", type=int, default=8, help="Total semesters")

    transit_cmd = sub.add_parser("transit", help="Solve shortest Jain Transit campus route.")
    transit_cmd.add_argument("--from-stop", default="Main Gate", help="Origin stop")
    transit_cmd.add_argument("--to-stop", default="AI & ML Lab", help="Destination stop")

    dsa_cmd = sub.add_parser("dsa", help="Run a Python DSA benchmark.")
    dsa_cmd.add_argument(
        "--algo",
        choices=["bus_bfs", "binary_search", "two_sum", "lcs_dp"],
        default="binary_search",
        help="Algorithm identifier",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "resume":
        print(generate_markdown_resume(PORTFOLIO_PROFILE))
        return 0

    if args.command == "stats":
        print(json.dumps(compute_repository_language_stats(), indent=2))
        return 0

    if args.command == "gpa":
        summary = summarize_academic_progression(PORTFOLIO_PROFILE.semesters)
        forecast = forecast_target_cgpa(
            PORTFOLIO_PROFILE.semesters,
            target_cgpa=args.target,
            total_semesters=args.semesters,
        )
        print(json.dumps({"summary": summary, "forecast": forecast}, indent=2))
        return 0

    if args.command == "transit":
        route = solve_jain_transit_route(args.from_stop, args.to_stop)
        print(json.dumps(route, indent=2))
        return 0

    if args.command == "dsa":
        result = run_algorithm(args.algo)
        print(json.dumps(result.to_dict(), indent=2))
        return 0

    return 1


if __name__ == "__main__":
    sys.exit(main())
