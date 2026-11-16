"""Live Python 3 DSA execution, AST analyzer, transit router, and codebase stats."""

from __future__ import annotations

import ast
import heapq
import inspect
import os
import time
from collections import deque
from pathlib import Path
from typing import Any

from python_app.models import AlgorithmRunResult
from python_app.portfolio_data import JAIN_TRANSIT_GRAPH, TRANSIT_DEPARTURES


def solve_jain_transit_route(start: str, destination: str) -> dict[str, Any]:
    """Compute shortest-time shuttle route using Dijkstra's algorithm in Python."""
    if start not in JAIN_TRANSIT_GRAPH or destination not in JAIN_TRANSIT_GRAPH:
        return {
            "found": False,
            "error": "Unknown campus stop selected.",
            "available_stops": sorted(JAIN_TRANSIT_GRAPH.keys()),
        }

    t0 = time.perf_counter()
    pq: list[tuple[int, str, list[dict[str, Any]]]] = [(0, start, [])]
    best_cost: dict[str, int] = {start: 0}

    while pq:
        minutes, node, segments = heapq.heappop(pq)
        if node == destination:
            elapsed_us = round((time.perf_counter() - t0) * 1_000_000, 2)
            return {
                "found": True,
                "start": start,
                "destination": destination,
                "total_minutes": minutes,
                "stops_count": len(segments) + 1,
                "path": [start, *[seg["to"] for seg in segments]],
                "segments": segments,
                "departures_at_origin": TRANSIT_DEPARTURES.get(start, []),
                "elapsed_microseconds": elapsed_us,
            }

        if minutes > best_cost.get(node, 10**9):
            continue

        for neighbor, travel_min, shuttle_name in JAIN_TRANSIT_GRAPH.get(node, []):
            next_cost = minutes + travel_min
            if next_cost < best_cost.get(neighbor, 10**9):
                best_cost[neighbor] = next_cost
                next_segments = [
                    *segments,
                    {
                        "from": node,
                        "to": neighbor,
                        "minutes": travel_min,
                        "shuttle": shuttle_name,
                    },
                ]
                heapq.heappush(pq, (next_cost, neighbor, next_segments))

    return {"found": False, "error": "No shuttle path available."}


def algo_binary_search(nums: list[int], target: int) -> tuple[dict[str, Any], list[str]]:
    """Binary search returning exact match index and insertion lower bound."""
    sorted_nums = sorted(nums)
    low, high = 0, len(sorted_nums) - 1
    trace: list[str] = []
    found_idx = -1

    while low <= high:
        mid = (low + high) // 2
        val = sorted_nums[mid]
        trace.append(f"low={low}, high={high} -> mid={mid} (value={val})")
        if val == target:
            found_idx = mid
            trace.append(f"Matched target {target} at sorted index {mid}")
            break
        if val < target:
            low = mid + 1
        else:
            high = mid - 1

    if found_idx == -1:
        trace.append(f"Target {target} not present; lower-bound insertion index is {low}")

    return {
        "sorted_array": sorted_nums,
        "target": target,
        "found_index": found_idx,
        "insertion_index": low if found_idx == -1 else found_idx,
    }, trace


def algo_two_sum(nums: list[int], target: int) -> tuple[dict[str, Any], list[str]]:
    """O(n) Hash-Map Two-Sum solver with step-by-step lookup trace."""
    seen: dict[int, int] = {}
    trace: list[str] = []

    for idx, val in enumerate(nums):
        complement = target - val
        if complement in seen:
            pair = [seen[complement], idx]
            trace.append(
                f"i={idx} (val={val}): complement {complement} found at index {seen[complement]}"
            )
            return {
                "indices": pair,
                "values": [nums[pair[0]], nums[pair[1]]],
                "target": target,
            }, trace
        seen[val] = idx
        trace.append(f"i={idx} (val={val}): stored {val} -> {idx}, need {complement}")

    trace.append(f"No pair sums to {target}")
    return {"indices": [], "values": [], "target": target}, trace


def algo_bus_bfs(start: str, destination: str) -> tuple[dict[str, Any], list[str]]:
    """Unweighted BFS minimum-hop shuttle solver for Jain Transit stops."""
    queue: deque[list[str]] = deque([[start]])
    visited = {start}
    trace: list[str] = [f"Enqueue start stop: {start}"]

    while queue:
        path = queue.popleft()
        current = path[-1]
        trace.append(f"Visit '{current}' (path length={len(path)})")
        if current == destination:
            trace.append(f"Reached '{destination}' in {len(path) - 1} shuttle hops")
            return {"hops": len(path) - 1, "route": path}, trace

        for neighbor, _, shuttle in JAIN_TRANSIT_GRAPH.get(current, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append([*path, neighbor])
                trace.append(f"  -> Discover '{neighbor}' via {shuttle}")

    return {"hops": -1, "route": []}, trace


def algo_lcs_dp(text_a: str, text_b: str) -> tuple[dict[str, Any], list[str]]:
    """2D Dynamic Programming Longest Common Subsequence solver."""
    a = text_a[:24]
    b = text_b[:24]
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    trace: list[str] = [f"Initialized ({m + 1}x{n + 1}) DP table for '{a}' and '{b}'"]

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

    # Backtrack LCS characters
    i, j = m, n
    chars: list[str] = []
    while i > 0 and j > 0:
        if a[i - 1] == b[j - 1]:
            chars.append(a[i - 1])
            i -= 1
            j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            i -= 1
        else:
            j -= 1

    lcs_str = "".join(reversed(chars))
    trace.append(f"DP optimal length = {dp[m][n]}")
    trace.append(f"Reconstructed subsequence = '{lcs_str}'")

    return {
        "length": dp[m][n],
        "subsequence": lcs_str,
        "matrix_size": f"{m + 1}x{n + 1}",
    }, trace


def inspect_python_ast(func: Any) -> dict[str, int]:
    """Use Python's ast module to count functions, loops, conditionals, and nodes."""
    source = inspect.getsource(func)
    tree = ast.parse(source)
    nodes = list(ast.walk(tree))
    return {
        "source_lines": len(source.strip().splitlines()),
        "ast_nodes": len(nodes),
        "loops": sum(isinstance(n, (ast.For, ast.While)) for n in nodes),
        "branches": sum(isinstance(n, ast.If) for n in nodes),
    }


ALGORITHM_REGISTRY: dict[str, dict[str, Any]] = {
    "bus_bfs": {
        "id": "bus_bfs",
        "title": "Jain Transit Shortest-Hop BFS",
        "category": "Graphs & Queues",
        "complexity_time": "O(V + E)",
        "complexity_space": "O(V)",
        "description": (
            "Finds the minimum-transfer campus shuttle path between stops using "
            "collections.deque breadth-first traversal."
        ),
        "func": algo_bus_bfs,
        "default_inputs": {"start": "Main Gate", "destination": "AI & ML Lab"},
    },
    "binary_search": {
        "id": "binary_search",
        "title": "Binary Search & Lower Bound",
        "category": "Divide & Conquer",
        "complexity_time": "O(log n)",
        "complexity_space": "O(1)",
        "description": (
            "Sorts integer arrays and locates exact target index or lower-bound "
            "insertion slot with step-by-step pointer bounds."
        ),
        "func": algo_binary_search,
        "default_inputs": {"nums": [4, 11, 18, 23, 35, 42, 58], "target": 23},
    },
    "two_sum": {
        "id": "two_sum",
        "title": "Two-Sum Hash Lookup",
        "category": "Hashing",
        "complexity_time": "O(n)",
        "complexity_space": "O(n)",
        "description": (
            "Single-pass complement lookup using Python dict hashing to identify "
            "index pairs summing to target."
        ),
        "func": algo_two_sum,
        "default_inputs": {"nums": [2, 7, 11, 15, 21], "target": 18},
    },
    "lcs_dp": {
        "id": "lcs_dp",
        "title": "Longest Common Subsequence (DP)",
        "category": "Dynamic Programming",
        "complexity_time": "O(m * n)",
        "complexity_space": "O(m * n)",
        "description": (
            "Builds a 2D memoization grid and backtracks the longest shared "
            "subsequence between two strings."
        ),
        "func": algo_lcs_dp,
        "default_inputs": {"text_a": "JAIN_PYTHON_AIML", "text_b": "PYTHON_TRANSIT_AI"},
    },
}


def list_algorithms() -> list[dict[str, Any]]:
    """Return metadata, source code, and AST metrics for every registered Python algorithm."""
    items: list[dict[str, Any]] = []
    for meta in ALGORITHM_REGISTRY.values():
        func = meta["func"]
        items.append(
            {
                "id": meta["id"],
                "title": meta["title"],
                "category": meta["category"],
                "complexity_time": meta["complexity_time"],
                "complexity_space": meta["complexity_space"],
                "description": meta["description"],
                "default_inputs": meta["default_inputs"],
                "source_code": inspect.getsource(func),
                "ast_summary": inspect_python_ast(func),
            }
        )
    return items


def run_algorithm(algorithm_id: str, payload: dict[str, Any] | None = None) -> AlgorithmRunResult:
    """Execute one of the registered Python DSA routines and benchmark runtime."""
    if algorithm_id not in ALGORITHM_REGISTRY:
        raise KeyError(f"Unknown algorithm '{algorithm_id}'")

    meta = ALGORITHM_REGISTRY[algorithm_id]
    func = meta["func"]
    params = dict(meta["default_inputs"])
    if payload:
        params.update(payload)

    t0 = time.perf_counter()
    if algorithm_id == "binary_search":
        nums = [int(x) for x in params.get("nums", [])[:50]]
        target = int(params.get("target", 0))
        sanitized_inputs = {"nums": nums, "target": target}
        output, trace = func(nums, target)
    elif algorithm_id == "two_sum":
        nums = [int(x) for x in params.get("nums", [])[:50]]
        target = int(params.get("target", 0))
        sanitized_inputs = {"nums": nums, "target": target}
        output, trace = func(nums, target)
    elif algorithm_id == "bus_bfs":
        start = str(params.get("start", "Main Gate"))
        destination = str(params.get("destination", "AI & ML Lab"))
        if start not in JAIN_TRANSIT_GRAPH:
            start = "Main Gate"
        if destination not in JAIN_TRANSIT_GRAPH:
            destination = "AI & ML Lab"
        sanitized_inputs = {"start": start, "destination": destination}
        output, trace = func(start, destination)
    else:
        text_a = str(params.get("text_a", "PYTHON_AIML"))
        text_b = str(params.get("text_b", "JAIN_PYTHON"))
        sanitized_inputs = {"text_a": text_a, "text_b": text_b}
        output, trace = func(text_a, text_b)

    elapsed_us = round((time.perf_counter() - t0) * 1_000_000, 2)
    return AlgorithmRunResult(
        algorithm_id=algorithm_id,
        title=meta["title"],
        complexity_time=meta["complexity_time"],
        complexity_space=meta["complexity_space"],
        elapsed_microseconds=elapsed_us,
        inputs=sanitized_inputs,
        output=output,
        trace=trace,
        ast_summary=inspect_python_ast(func),
    )


def compute_repository_language_stats(root_dir: str | Path | None = None) -> dict[str, Any]:
    """
    Scan source directories and compute real byte & line percentages per language.

    Excludes build artifacts, dependencies, and config lockfiles so the metric
    reflects true application source composition.
    """
    base = Path(root_dir or os.getcwd())
    ext_map = {
        ".py": "Python",
        ".tsx": "TypeScript",
        ".ts": "TypeScript",
        ".css": "CSS",
        ".html": "HTML",
    }
    ignored_dirs = {"node_modules", "dist", ".git", "__pycache__", ".aistudio"}
    ignored_files = {"vite.config.ts", "tsconfig.json", "package-lock.json"}

    totals: dict[str, dict[str, int]] = {
        lang: {"bytes": 0, "lines": 0, "files": 0}
        for lang in ("Python", "TypeScript", "CSS", "HTML")
    }

    for current_root, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.startswith(".")]
        for fname in files:
            if fname in ignored_files:
                continue
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

    total_bytes = sum(v["bytes"] for v in totals.values()) or 1
    breakdown = []
    for lang, stats in totals.items():
        pct = round((stats["bytes"] / total_bytes) * 100.0, 1)
        breakdown.append(
            {
                "language": lang,
                "bytes": stats["bytes"],
                "lines": stats["lines"],
                "files": stats["files"],
                "percentage": pct,
            }
        )

    breakdown.sort(key=lambda item: item["bytes"], reverse=True)
    python_pct = next((b["percentage"] for b in breakdown if b["language"] == "Python"), 0.0)
    return {
        "total_bytes": total_bytes,
        "python_percentage": python_pct,
        "languages": breakdown,
    }
