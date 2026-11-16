"""Python academic analytics and CGPA target forecasting module."""

from __future__ import annotations

import statistics
from typing import Any

from python_app.models import SemesterScore


def summarize_academic_progression(semesters: list[SemesterScore]) -> dict[str, Any]:
    """Compute CGPA progression statistics using Python's statistics module."""
    if not semesters:
        return {
            "current_cgpa": 0.0,
            "semester_delta": 0.0,
            "percent_growth": 0.0,
            "mean_sgpa": 0.0,
            "stdev_sgpa": 0.0,
            "total_credits": 0,
        }

    scores = [s.sgpa for s in semesters]
    total_credits = sum(s.credits for s in semesters)
    weighted_sum = sum(s.sgpa * s.credits for s in semesters)
    current_cgpa = round(weighted_sum / total_credits, 3) if total_credits else 0.0

    delta = round(scores[-1] - scores[0], 3) if len(scores) >= 2 else 0.0
    pct_growth = round((delta / scores[0]) * 100.0, 2) if len(scores) >= 2 and scores[0] > 0 else 0.0
    mean_val = round(statistics.mean(scores), 3)
    stdev_val = round(statistics.pstdev(scores), 3) if len(scores) > 1 else 0.0

    return {
        "current_cgpa": current_cgpa,
        "latest_sgpa": scores[-1],
        "first_sgpa": scores[0],
        "semester_delta": delta,
        "percent_growth": pct_growth,
        "mean_sgpa": mean_val,
        "stdev_sgpa": stdev_val,
        "total_credits": total_credits,
        "completed_semesters": len(semesters),
    }


def forecast_target_cgpa(
    semesters: list[SemesterScore],
    target_cgpa: float,
    total_semesters: int = 8,
) -> dict[str, Any]:
    """
    Calculate the required SGPA across remaining semesters to reach target_cgpa.

    Assumes equal credit weight for upcoming semesters matching the average
    semester credit load.
    """
    clamped_target = max(0.0, min(10.0, float(target_cgpa)))
    total_sems = max(len(semesters) + 1, min(10, int(total_semesters)))

    completed_count = len(semesters)
    remaining_count = total_sems - completed_count
    avg_credits = round(sum(s.credits for s in semesters) / completed_count) if completed_count else 22

    earned_points = sum(s.sgpa * s.credits for s in semesters)
    earned_credits = sum(s.credits for s in semesters)
    future_credits = remaining_count * avg_credits
    total_credits_after = earned_credits + future_credits

    required_total_points = clamped_target * total_credits_after
    required_future_points = required_total_points - earned_points
    required_sgpa = round(required_future_points / future_credits, 3) if future_credits > 0 else 0.0

    achievable = 0.0 <= required_sgpa <= 10.0
    max_possible_cgpa = round(
        (earned_points + (10.0 * future_credits)) / total_credits_after,
        3,
    )

    trajectory: list[dict[str, Any]] = [
        {
            "semester": s.semester,
            "label": f"Sem {s.semester}",
            "sgpa": s.sgpa,
            "kind": "completed",
        }
        for s in semesters
    ]

    projected_sgpa = min(10.0, max(0.0, required_sgpa))
    for sem_num in range(completed_count + 1, total_sems + 1):
        trajectory.append(
            {
                "semester": sem_num,
                "label": f"Sem {sem_num}",
                "sgpa": round(projected_sgpa, 2),
                "kind": "projected",
            }
        )

    return {
        "target_cgpa": round(clamped_target, 2),
        "total_semesters": total_sems,
        "completed_semesters": completed_count,
        "remaining_semesters": remaining_count,
        "required_sgpa_per_semester": required_sgpa,
        "achievable": achievable,
        "max_possible_cgpa": max_possible_cgpa,
        "trajectory": trajectory,
        "summary": (
            f"Needs {required_sgpa:.2f} SGPA across the next {remaining_count} semesters"
            if achievable
            else f"Target {clamped_target:.2f} exceeds 10.0 cap (max reachable: {max_possible_cgpa:.2f})"
        ),
    }
