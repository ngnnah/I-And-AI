#!/usr/bin/env python3
"""Generate daily log files for the seasons skill from JSON data.

Overview
--------
Generates 365 daily markdown files, one for each day of the year.
Each file contains seasonal wisdom based on Japan's 72 micro-seasons (kō).

Data Flow
---------
    seasons_data.json  →  generate_logs.py  →  logs/2026-01-01.md
       (72 seasons)         (this script)       logs/2026-01-02.md
                                                ...
                                                (365 files)

Processing Pipeline
-------------------
    Date (e.g., Jan 24)
           ↓
    get_ko_for_date()  →  find matching kō (#70: Jan 20-24)
           ↓
    get_day_index()    →  day position within kō (day 4 of 5)
           ↓
    generate_log_content()  →  select practice[4], build markdown
           ↓
    Write to logs/2026-01-24.md

"""

import json
from calendar import month_name
from datetime import date, timedelta
from pathlib import Path


def load_data() -> list[dict]:
    """Load kō data from JSON file."""
    data_file = Path(__file__).parent / "seasons_data.json"
    return json.loads(data_file.read_text())["ko"]


def format_date_range(start: list[int], end: list[int]) -> str:
    """Format date range for display."""
    sm, sd = start
    em, ed = end
    if sm == em:
        return f"{month_name[sm]} {sd}-{ed}"
    return f"{month_name[sm]} {sd}-{month_name[em]} {ed}"


def date_in_range(d: date, start: list[int], end: list[int]) -> bool:
    """Check if a date falls within a kō's date range."""
    sm, sd = start
    em, ed = end
    m, day = d.month, d.day

    if sm > em:  # Crosses year boundary (e.g., Jan 30 - Feb 3)
        return (m == sm and day >= sd) or (m == em and day <= ed) or m > sm or m < em
    if sm == em:
        return m == sm and sd <= day <= ed
    return (m == sm and day >= sd) or (m == em and day <= ed)


def get_ko_for_date(d: date, ko_list: list[dict]) -> dict | None:
    """Find which kō a given date falls into."""
    for ko in ko_list:
        if date_in_range(d, ko["start"], ko["end"]):
            return ko
    return None


def get_day_index(d: date, ko: dict) -> int:
    """Get the 0-indexed day position within a kō period."""
    sm, sd = ko["start"]
    year = d.year if sm <= d.month else d.year - 1
    start_date = date(year, sm, sd)
    return (d - start_date).days


def generate_log_content(d: date, ko: dict, day_index: int) -> str:
    """Generate the markdown content for a log file."""
    practice = ko["practices"][day_index % len(ko["practices"])]
    date_range = format_date_range(ko["start"], ko["end"])

    resources = "\n".join(f"- {r}" for r in ko["resources"])

    return f"""## 第{ko["num"]}候 · {ko["romaji"]}

### "{ko["english"]}"

> {date_range} · {ko["sekki_jp"]} ({ko["sekki_en"]})

<img src="../images/{ko["num"]:02d}-{ko["slug"]}.jpg" alt="{ko["english"]}" width="480">

**Why now?** {ko["why_now"]}

**Insight:** {ko["insight"]}

**Today's practice:** {practice}

> **💬** "{ko["quote"]}"
> — {ko["author"]}

**Learn more:**

{resources}
"""


def generate_all_logs(year: int = 2026):
    """Generate log files for every day of the year."""
    ko_list = load_data()
    logs_dir = Path(__file__).parent / "logs"
    logs_dir.mkdir(exist_ok=True)

    start = date(year, 1, 1)
    end = date(year, 12, 31)
    generated = skipped = 0

    current = start
    while current <= end:
        ko = get_ko_for_date(current, ko_list)
        if ko:
            day_index = get_day_index(current, ko)
            content = generate_log_content(current, ko, day_index)
            (logs_dir / f"{current.isoformat()}.md").write_text(content)
            generated += 1
        else:
            print(f"Warning: No kō found for {current}")
            skipped += 1
        current += timedelta(days=1)

    print(f"Generated {generated} log files, skipped {skipped}")


if __name__ == "__main__":
    generate_all_logs()
