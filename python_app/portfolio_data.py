"""Authentic portfolio dataset and transit graph model for Dadiyala Lathish Gokul."""

from __future__ import annotations

from python_app.models import (
    CertificationRecord,
    Profile,
    ProjectSpec,
    SemesterScore,
    SkillArea,
)

PORTFOLIO_PROFILE = Profile(
    name="Dadiyala Lathish Gokul",
    headline=(
        "Second-year B.Tech student in Computer Science and Engineering "
        "(AI & ML) at Jain University."
    ),
    degree="B.Tech, Computer Science and Engineering (AI & ML)",
    university="Jain University",
    year_of_study="2nd Year",
    location="Tirupati, Andhra Pradesh",
    email="dadiyalalathishgokul@gmail.com",
    about=(
        "I'm looking for a fresher role or internship where I can apply my "
        "programming, data structures and algorithms, and project experience. "
        "I like solving problems, learning new things, and contributing to a team."
    ),
    availability="Open to internships and entry-level software / AI & ML roles",
    semesters=[
        SemesterScore(
            semester=1,
            label="Semester 1",
            sgpa=7.05,
            max_scale=10.0,
            credits=22,
            focus="Foundational Programming, Engineering Mathematics, Problem Solving",
        ),
        SemesterScore(
            semester=2,
            label="Semester 2",
            sgpa=7.862,
            max_scale=10.0,
            credits=22,
            focus="Data Structures, Discrete Structures, Back-End & Database Foundations",
        ),
    ],
    skills=[
        SkillArea(
            id="dsa",
            title="Data structures and algorithms",
            summary=(
                "Strong foundation in arrays, linked structures, trees, graphs, "
                "hashing, binary search, and dynamic programming applied in Python."
            ),
            python_focus="Implemented with clean time/space bounds using Python stdlib collections & heapq.",
            code_example=(
                "from collections import deque\n\n"
                "def shortest_hop_route(graph: dict[str, list[str]], start: str, goal: str) -> list[str]:\n"
                "    queue = deque([[start]])\n"
                "    visited = {start}\n"
                "    while queue:\n"
                "        path = queue.popleft()\n"
                "        if path[-1] == goal:\n"
                "            return path\n"
                "        for nxt in graph.get(path[-1], []):\n"
                "            if nxt not in visited:\n"
                "                visited.add(nxt)\n"
                "                queue.append([*path, nxt])\n"
                "    return []"
            ),
            tools=["Python 3.10", "Graph BFS / Dijkstra", "Dynamic Programming", "Hash Maps"],
        ),
        SkillArea(
            id="backend-db",
            title="Back-end and database development",
            summary=(
                "Designing REST endpoints, structured relational schemas, and "
                "predictable query pipelines for student-facing applications."
            ),
            python_focus="Python HTTP services, SQLite3 relational storage, and typed dataclass validation.",
            code_example=(
                "import sqlite3\n\n"
                "def fetch_next_departures(conn: sqlite3.Connection, stop_code: str) -> list[tuple]:\n"
                "    query = (\n"
                "        'SELECT route_id, departure_time, platform '\n"
                "        'FROM bus_schedules WHERE stop_code = ? ORDER BY departure_time ASC'\n"
                "    )\n"
                "    return conn.execute(query, (stop_code,)).fetchall()"
            ),
            tools=["Python HTTP & APIs", "SQLite / SQL", "Schema Modeling", "REST JSON"],
        ),
        SkillArea(
            id="ui-design",
            title="User interface design and development",
            summary=(
                "Crafting accessible, clean, responsive interfaces with clear "
                "typographic hierarchy and thoughtful interactive flows."
            ),
            python_focus="Served seamlessly over Python JSON APIs with real-time algorithmic feedback.",
            code_example=(
                "@dataclass(frozen=True)\n"
                "class UiResponse:\n"
                "    status: str\n"
                "    payload: dict\n"
                "    render_ms: float\n"
            ),
            tools=["TypeScript & React", "Tailwind CSS", "Responsive Design", "WCAG Accessibility"],
        ),
    ],
    projects=[
        ProjectSpec(
            id="jain-transit",
            index_label="01. Jain Transit",
            title="Jain Transit",
            category="Smart Transportation · Back-End & Database",
            summary=(
                "A smart transportation website that helps students track college "
                "buses, view live bus timings, and find important transit information "
                "for easier travel."
            ),
            role="My role: designed and contributed to the back end and the database.",
            image_path="/src/assets/images/project_jain_transit_1794852970957.jpg",
            python_component="Live Python BFS & Dijkstra campus shuttle route solver",
            highlights=[
                "Structured bus route, stop sequence, and departure timetable schema",
                "Fast stop-to-stop shortest transit lookup modeled in Python",
                "Clear commuter schedule queries designed for daily campus rush hours",
            ],
            stack=["Python", "SQLite / Relational DB", "REST API", "Transit Routing"],
        ),
        ProjectSpec(
            id="wonderla-sentinel",
            index_label="02. Wonderla Sentinel",
            title="Wonderla Sentinel",
            category="Experimental AI · Interactive Web Experience",
            summary=(
                "An interactive, AI-powered experimental website that explores "
                "creative ideas, artificial intelligence, and new digital experiences."
            ),
            role=(
                "My role: contributed to design and development, focusing on the "
                "user interface, interactive features, and a user-friendly experience."
            ),
            image_path="/src/assets/images/project_wonderla_sentinel_1794852971063.jpg",
            python_component="Python-backed interactive scoring & narrative experiment state",
            highlights=[
                "Interactive AI-assisted creative exploration flow",
                "Responsive layout and focused UI interactions for smooth discovery",
                "Modular frontend architecture paired with structured JSON responses",
            ],
            stack=["AI Concepts", "Interactive UI", "Python API", "TypeScript"],
        ),
    ],
    certifications=[
        CertificationRecord(
            id="dsa-cert-2025",
            title="Data Structures and Algorithms (DSA) course and certificate",
            period="1 May 2025 – 7 August 2025",
            issuer="Verified DSA Training Program",
            focus_topics=[
                "Asymptotic Complexity (Big-O)",
                "Arrays, Stacks, Queues & Linked Lists",
                "Trees, Graphs & Shortest Path Traversals",
                "Recursion & Dynamic Programming",
            ],
        )
    ],
)

# Campus transit graph used by both Jain Transit showcase and the Python DSA lab
JAIN_TRANSIT_GRAPH: dict[str, list[tuple[str, int, str]]] = {
    "Main Gate": [
        ("Transit Terminal", 3, "Shuttle S1"),
        ("Hostel Precinct", 5, "Shuttle S2"),
    ],
    "Transit Terminal": [
        ("Main Gate", 3, "Shuttle S1"),
        ("Central Library", 4, "Shuttle S1"),
        ("Academic Block A", 6, "Express E1"),
    ],
    "Hostel Precinct": [
        ("Main Gate", 5, "Shuttle S2"),
        ("Sports Complex", 3, "Shuttle S2"),
        ("Central Library", 4, "Campus Loop"),
    ],
    "Central Library": [
        ("Transit Terminal", 4, "Shuttle S1"),
        ("Hostel Precinct", 4, "Campus Loop"),
        ("Academic Block A", 2, "Shuttle S1"),
        ("AI & ML Lab", 5, "Tech Shuttle"),
    ],
    "Sports Complex": [
        ("Hostel Precinct", 3, "Shuttle S2"),
        ("AI & ML Lab", 6, "Campus Loop"),
    ],
    "Academic Block A": [
        ("Transit Terminal", 6, "Express E1"),
        ("Central Library", 2, "Shuttle S1"),
        ("AI & ML Lab", 3, "Tech Shuttle"),
    ],
    "AI & ML Lab": [
        ("Academic Block A", 3, "Tech Shuttle"),
        ("Central Library", 5, "Tech Shuttle"),
        ("Sports Complex", 6, "Campus Loop"),
    ],
}

TRANSIT_DEPARTURES: dict[str, list[dict[str, str]]] = {
    "Main Gate": [
        {"route": "Shuttle S1", "next_bus": "08:15 AM", "destination": "Academic Block A", "status": "On Time"},
        {"route": "Shuttle S2", "next_bus": "08:22 AM", "destination": "Hostel Precinct", "status": "Boarding"},
    ],
    "Transit Terminal": [
        {"route": "Express E1", "next_bus": "08:18 AM", "destination": "Academic Block A", "status": "On Time"},
        {"route": "Shuttle S1", "next_bus": "08:25 AM", "destination": "Central Library", "status": "On Time"},
    ],
    "Central Library": [
        {"route": "Shuttle S1", "next_bus": "08:20 AM", "destination": "Academic Block A", "status": "Arriving"},
        {"route": "Tech Shuttle", "next_bus": "08:28 AM", "destination": "AI & ML Lab", "status": "On Time"},
    ],
    "Academic Block A": [
        {"route": "Tech Shuttle", "next_bus": "08:24 AM", "destination": "AI & ML Lab", "status": "On Time"},
        {"route": "Express E1", "next_bus": "08:35 AM", "destination": "Transit Terminal", "status": "Scheduled"},
    ],
    "AI & ML Lab": [
        {"route": "Tech Shuttle", "next_bus": "08:30 AM", "destination": "Central Library", "status": "On Time"},
        {"route": "Campus Loop", "next_bus": "08:40 AM", "destination": "Sports Complex", "status": "Scheduled"},
    ],
    "Hostel Precinct": [
        {"route": "Campus Loop", "next_bus": "08:12 AM", "destination": "Central Library", "status": "Boarding"},
        {"route": "Shuttle S2", "next_bus": "08:25 AM", "destination": "Main Gate", "status": "On Time"},
    ],
    "Sports Complex": [
        {"route": "Campus Loop", "next_bus": "08:19 AM", "destination": "AI & ML Lab", "status": "On Time"},
        {"route": "Shuttle S2", "next_bus": "08:32 AM", "destination": "Hostel Precinct", "status": "Scheduled"},
    ],
}
