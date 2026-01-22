#!/usr/bin/env python3
"""PDF utility for text extraction and metadata.

Examples:
    uv run tools/pdf_util.py extract document.pdf
    uv run tools/pdf_util.py extract document.pdf --pages 1-5
    uv run tools/pdf_util.py info document.pdf
    uv run tools/pdf_util.py search document.pdf "search term"
    uv run tools/pdf_util.py toc document.pdf
"""

import argparse
import sys
from pathlib import Path

from pypdf import PdfReader


def cmd_extract(args: argparse.Namespace) -> None:
    """Extract text from PDF."""
    reader = PdfReader(args.file)
    total_pages = len(reader.pages)

    # Parse page range
    if args.pages:
        start, end = parse_page_range(args.pages, total_pages)
    else:
        start, end = 0, total_pages

    for i in range(start, end):
        page = reader.pages[i]
        text = page.extract_text()

        if args.verbose:
            print(f"\n{'='*60}")
            print(f"Page {i + 1}")
            print("=" * 60)

        if text:
            print(text)
        elif args.verbose:
            print("[No text extracted - may be scanned/image-based]")


def cmd_info(args: argparse.Namespace) -> None:
    """Show PDF metadata and info."""
    reader = PdfReader(args.file)
    meta = reader.metadata

    print(f"File: {args.file}")
    print(f"Pages: {len(reader.pages)}")

    if meta:
        print("\nMetadata:")
        if meta.title:
            print(f"  Title: {meta.title}")
        if meta.author:
            print(f"  Author: {meta.author}")
        if meta.subject:
            print(f"  Subject: {meta.subject}")
        if meta.creator:
            print(f"  Creator: {meta.creator}")
        if meta.producer:
            print(f"  Producer: {meta.producer}")
        if meta.creation_date:
            print(f"  Created: {meta.creation_date}")
        if meta.modification_date:
            print(f"  Modified: {meta.modification_date}")

    # Check for encryption
    if reader.is_encrypted:
        print("\nNote: PDF is encrypted")

    # Page size from first page
    if reader.pages:
        page = reader.pages[0]
        box = page.mediabox
        width = float(box.width)
        height = float(box.height)
        # Convert points to inches (72 points = 1 inch)
        print(
            f'\nPage size: {width:.0f} x {height:.0f} pts ({width/72:.1f}" x {height/72:.1f}")'
        )


def cmd_search(args: argparse.Namespace) -> None:
    """Search for text in PDF."""
    reader = PdfReader(args.file)
    query = args.query.lower() if args.ignore_case else args.query
    found = False

    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if not text:
            continue

        search_text = text.lower() if args.ignore_case else text

        if query in search_text:
            found = True
            print(f"\n--- Page {i + 1} ---")

            # Find and show context around matches
            lines = text.split("\n")
            for line_num, line in enumerate(lines):
                search_line = line.lower() if args.ignore_case else line
                if query in search_line:
                    # Show surrounding context
                    start = max(0, line_num - args.context)
                    end = min(len(lines), line_num + args.context + 1)
                    for j in range(start, end):
                        prefix = ">>> " if j == line_num else "    "
                        print(f"{prefix}{lines[j]}")
                    print()

    if not found:
        print(f"No matches found for '{args.query}'")
        sys.exit(1)


def cmd_toc(args: argparse.Namespace) -> None:
    """Show table of contents / outline."""
    reader = PdfReader(args.file)

    try:
        outline = reader.outline
        if not outline:
            print("No table of contents found")
            return

        def print_outline(items: list, level: int = 0) -> None:
            for item in items:
                if isinstance(item, list):
                    print_outline(item, level + 1)
                else:
                    indent = "  " * level
                    title = item.title if hasattr(item, "title") else str(item)
                    print(f"{indent}- {title}")

        print_outline(outline)
    except Exception as e:
        print(f"Could not extract outline: {e}")


def parse_page_range(s: str, total: int) -> tuple[int, int]:
    """Parse page range string like '1-5' or '3'."""
    if "-" in s:
        parts = s.split("-")
        start = int(parts[0]) - 1  # Convert to 0-indexed
        end = int(parts[1]) if parts[1] else total
        return max(0, start), min(end, total)
    else:
        page = int(s) - 1
        return page, page + 1


def main() -> None:
    parser = argparse.ArgumentParser(
        description="PDF utility for text extraction and metadata",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # extract
    p_extract = subparsers.add_parser("extract", help="Extract text from PDF")
    p_extract.add_argument("file", type=Path, help="PDF file path")
    p_extract.add_argument("--pages", help="Page range (e.g., '1-5' or '3')")
    p_extract.add_argument(
        "-v", "--verbose", action="store_true", help="Show page markers"
    )
    p_extract.set_defaults(func=cmd_extract)

    # info
    p_info = subparsers.add_parser("info", help="Show PDF metadata")
    p_info.add_argument("file", type=Path, help="PDF file path")
    p_info.set_defaults(func=cmd_info)

    # search
    p_search = subparsers.add_parser("search", help="Search text in PDF")
    p_search.add_argument("file", type=Path, help="PDF file path")
    p_search.add_argument("query", help="Search term")
    p_search.add_argument(
        "-i", "--ignore-case", action="store_true", help="Case insensitive"
    )
    p_search.add_argument(
        "-C", "--context", type=int, default=2, help="Lines of context"
    )
    p_search.set_defaults(func=cmd_search)

    # toc
    p_toc = subparsers.add_parser("toc", help="Show table of contents")
    p_toc.add_argument("file", type=Path, help="PDF file path")
    p_toc.set_defaults(func=cmd_toc)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
