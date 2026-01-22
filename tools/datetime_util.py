#!/usr/bin/env python3
"""Datetime utility for timezone conversions and calculations.

Uses only stdlib (zoneinfo, datetime). No external dependencies.

Examples:
    uv run tools/datetime_util.py now --tz America/New_York Asia/Tokyo
    uv run tools/datetime_util.py convert "2024-01-15 09:00" --from America/New_York --to Asia/Tokyo
    uv run tools/datetime_util.py diff "2024-01-15" "2024-03-20"
    uv run tools/datetime_util.py add "2024-01-15" --days 30
    uv run tools/datetime_util.py timestamp 1705330200
    uv run tools/datetime_util.py parse "January 15, 2024 2:30 PM"
"""

import argparse
import sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, available_timezones

# Common timezone aliases
TZ_ALIASES: dict[str, str] = {
    "EST": "America/New_York",
    "EDT": "America/New_York",
    "CST": "America/Chicago",
    "CDT": "America/Chicago",
    "MST": "America/Denver",
    "MDT": "America/Denver",
    "PST": "America/Los_Angeles",
    "PDT": "America/Los_Angeles",
    "GMT": "UTC",
    "CET": "Europe/Paris",
    "CEST": "Europe/Paris",
    "JST": "Asia/Tokyo",
    "KST": "Asia/Seoul",
    "IST": "Asia/Kolkata",
    "SGT": "Asia/Singapore",
    "ICT": "Asia/Bangkok",  # Vietnam also uses ICT
    "AEST": "Australia/Sydney",
    "AEDT": "Australia/Sydney",
    "AWST": "Australia/Perth",
    "NZST": "Pacific/Auckland",
    "NZDT": "Pacific/Auckland",
}


def resolve_tz(tz_str: str) -> ZoneInfo:
    """Resolve timezone string to ZoneInfo, supporting aliases."""
    tz_upper = tz_str.upper()
    if tz_upper in TZ_ALIASES:
        return ZoneInfo(TZ_ALIASES[tz_upper])
    if tz_str in available_timezones() or tz_str == "UTC":
        return ZoneInfo(tz_str)
    # Try case-insensitive match
    tz_lower = tz_str.lower()
    for tz in available_timezones():
        if tz.lower() == tz_lower:
            return ZoneInfo(tz)
    raise ValueError(f"Unknown timezone: {tz_str}")


def format_dt(dt: datetime, include_offset: bool = True) -> str:
    """Format datetime for display."""
    if include_offset and dt.tzinfo:
        offset = dt.strftime("%z")
        offset_formatted = f"{offset[:3]}:{offset[3:]}" if offset else ""
        return f"{dt.strftime('%Y-%m-%d %H:%M:%S')} ({offset_formatted})"
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def cmd_now(args: argparse.Namespace) -> None:
    """Show current time in specified timezones."""
    now_utc = datetime.now(ZoneInfo("UTC"))

    print(f"UTC: {format_dt(now_utc)}")

    for tz_str in args.tz:
        try:
            tz = resolve_tz(tz_str)
            local = now_utc.astimezone(tz)
            print(f"{tz_str}: {format_dt(local)}")
        except ValueError as e:
            print(f"{tz_str}: Error - {e}", file=sys.stderr)


def cmd_convert(args: argparse.Namespace) -> None:
    """Convert time between timezones."""
    from_tz = resolve_tz(args.from_tz)
    to_tz = resolve_tz(args.to_tz)

    # Parse input time
    dt = parse_datetime(args.time)
    dt = dt.replace(tzinfo=from_tz)

    converted = dt.astimezone(to_tz)

    print(f"From: {format_dt(dt)} {args.from_tz}")
    print(f"To:   {format_dt(converted)} {args.to_tz}")


def cmd_diff(args: argparse.Namespace) -> None:
    """Calculate duration between two dates."""
    dt1 = parse_datetime(args.start)
    dt2 = parse_datetime(args.end)

    delta = dt2 - dt1
    days = delta.days
    seconds = delta.seconds

    # Handle negative durations
    if days < 0:
        print("Note: End date is before start date")
        days = abs(days)

    weeks, remaining_days = divmod(days, 7)
    hours, remainder = divmod(seconds, 3600)
    minutes, secs = divmod(remainder, 60)

    print(f"From: {dt1.strftime('%Y-%m-%d')}")
    print(f"To:   {dt2.strftime('%Y-%m-%d')}")
    print()
    print(f"Duration:")
    print(f"  {days} days")
    if weeks:
        print(f"  {weeks} weeks, {remaining_days} days")
    if hours or minutes:
        print(f"  {hours} hours, {minutes} minutes")


def cmd_add(args: argparse.Namespace) -> None:
    """Add duration to a date."""
    dt = parse_datetime(args.date)

    delta = timedelta(
        days=args.days or 0,
        weeks=args.weeks or 0,
        hours=args.hours or 0,
        minutes=args.minutes or 0,
    )

    result = dt + delta

    print(f"Start:  {dt.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Add:    {delta}")
    print(f"Result: {result.strftime('%Y-%m-%d %H:%M:%S')}")


def cmd_timestamp(args: argparse.Namespace) -> None:
    """Convert Unix timestamp to human-readable format."""
    ts = args.timestamp

    # Handle milliseconds
    if ts > 1e12:
        ts = ts / 1000

    dt = datetime.fromtimestamp(ts, tz=ZoneInfo("UTC"))

    print(f"Unix timestamp: {int(args.timestamp)}")
    print(f"ISO 8601:       {dt.isoformat()}")
    print(f"RFC 2822:       {dt.strftime('%a, %d %b %Y %H:%M:%S %z')}")
    print(f"Human:          {dt.strftime('%B %d, %Y %I:%M:%S %p %Z')}")

    if args.tz:
        for tz_str in args.tz:
            try:
                tz = resolve_tz(tz_str)
                local = dt.astimezone(tz)
                print(f"{tz_str}:          {format_dt(local)}")
            except ValueError as e:
                print(f"{tz_str}: Error - {e}", file=sys.stderr)


def cmd_parse(args: argparse.Namespace) -> None:
    """Parse various date formats and show in standard format."""
    dt = parse_datetime(args.input)

    print(f"Input:     {args.input}")
    print(f"Parsed:    {dt.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"ISO 8601:  {dt.isoformat()}")
    if dt.tzinfo:
        print(f"Timestamp: {int(dt.timestamp())}")


def parse_datetime(s: str) -> datetime:
    """Parse datetime from various formats."""
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%Y/%m/%d %H:%M:%S",
        "%Y/%m/%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%B %d, %Y %I:%M %p",
        "%B %d, %Y %I:%M:%S %p",
        "%B %d, %Y",
        "%b %d, %Y",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue

    # Try ISO format with timezone
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        pass

    raise ValueError(f"Could not parse date: {s}")


def cmd_list_tz(args: argparse.Namespace) -> None:
    """List available timezones."""
    query = args.query.lower() if args.query else None

    print("Aliases:")
    for alias, tz in sorted(TZ_ALIASES.items()):
        if not query or query in alias.lower() or query in tz.lower():
            print(f"  {alias:6} -> {tz}")

    if args.all:
        print("\nAll IANA timezones:")
        for tz in sorted(available_timezones()):
            if not query or query in tz.lower():
                print(f"  {tz}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Datetime utility for timezone conversions and calculations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # now
    p_now = subparsers.add_parser("now", help="Show current time")
    p_now.add_argument("--tz", nargs="+", default=[], help="Timezones to show")
    p_now.set_defaults(func=cmd_now)

    # convert
    p_convert = subparsers.add_parser("convert", help="Convert time between zones")
    p_convert.add_argument("time", help="Time to convert (e.g., '2024-01-15 09:00')")
    p_convert.add_argument(
        "--from", dest="from_tz", required=True, help="Source timezone"
    )
    p_convert.add_argument("--to", dest="to_tz", required=True, help="Target timezone")
    p_convert.set_defaults(func=cmd_convert)

    # diff
    p_diff = subparsers.add_parser("diff", help="Calculate duration between dates")
    p_diff.add_argument("start", help="Start date")
    p_diff.add_argument("end", help="End date")
    p_diff.set_defaults(func=cmd_diff)

    # add
    p_add = subparsers.add_parser("add", help="Add duration to date")
    p_add.add_argument("date", help="Start date")
    p_add.add_argument("--days", type=int, help="Days to add")
    p_add.add_argument("--weeks", type=int, help="Weeks to add")
    p_add.add_argument("--hours", type=int, help="Hours to add")
    p_add.add_argument("--minutes", type=int, help="Minutes to add")
    p_add.set_defaults(func=cmd_add)

    # timestamp
    p_ts = subparsers.add_parser("timestamp", help="Convert Unix timestamp")
    p_ts.add_argument("timestamp", type=float, help="Unix timestamp")
    p_ts.add_argument("--tz", nargs="+", default=[], help="Additional timezones")
    p_ts.set_defaults(func=cmd_timestamp)

    # parse
    p_parse = subparsers.add_parser("parse", help="Parse date string")
    p_parse.add_argument("input", help="Date string to parse")
    p_parse.set_defaults(func=cmd_parse)

    # list-tz
    p_list = subparsers.add_parser("list-tz", help="List timezones")
    p_list.add_argument("query", nargs="?", help="Filter timezones")
    p_list.add_argument("--all", action="store_true", help="Show all IANA timezones")
    p_list.set_defaults(func=cmd_list_tz)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
