#!/usr/bin/env python3
"""Generate PDF for today's micro-season.

Usage:
    uv run generate_pdf.py              # Generate today's season PDF
    uv run generate_pdf.py 70           # Generate PDF for specific kō
"""

import sys
from datetime import date
from pathlib import Path

from fpdf import FPDF

# Season data for all 72 kō
SEASONS = {
    70: {
        "romaji": "Fuki no hana saku",
        "english": "Butterburs bud",
        "dates": "January 20-24",
        "sekki": "Daikan (Major Cold)",
        "image": "70-fuki-no-hana-saku.jpg",
    },
    71: {
        "romaji": "Sawamizu kori tsumeru",
        "english": "Ice thickens on streams",
        "dates": "January 25-29",
        "sekki": "Daikan (Major Cold)",
        "image": "71-sawamizu-kori-tsumeru.jpg",
    },
    72: {
        "romaji": "Niwatori hajimete toya ni tsuku",
        "english": "Hens start laying",
        "dates": "January 30-February 3",
        "sekki": "Daikan (Major Cold)",
        "image": "72-niwatori-hajimete-toya-ni-tsuku.jpg",
    },
}

# Content for kō 70 (current season)
KO_70_CONTENT = {
    "why_now": (
        "While air temperatures hit their coldest, soil deeper underground retains "
        "warmth from accumulated summer heat. The butterbur's roots tap this hidden "
        "thermal reserve, sending up flower stalks before any competitor stirs - "
        "first-mover advantage in nature's economy."
    ),
    "insight": (
        "The coldest days come after the solstice turn, not before. Light has been "
        "returning for a full month - the reversal is well underway, even when conditions "
        'feel harshest. This is the "hidden spring": potential precedes manifestation. '
        "The butterbur doesn't wait for permission or perfect conditions. It acts on knowing."
    ),
    "practice": (
        "Identify one initiative that's quietly building momentum beneath the surface - "
        "something others can't see yet. Give it 15 minutes of focused attention. "
        "Water roots that haven't broken ground."
    ),
    "quote": "The world is full of magic things, patiently waiting for our senses to grow sharper.",
    "quote_author": "W.B. Yeats",
}


class SeasonPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "I", 10)
        self.set_text_color(128, 128, 128)
        self.cell(
            0, 10, "72 Japanese Micro-Seasons", align="R", new_x="LMARGIN", new_y="NEXT"
        )
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Generated {date.today().isoformat()}", align="C")


def generate_pdf(ko_num: int, output_path: Path) -> None:
    """Generate PDF for a specific kō."""
    if ko_num not in SEASONS:
        print(f"Kō {ko_num} not configured yet")
        return

    season = SEASONS[ko_num]
    content = KO_70_CONTENT  # For now, only kō 70 has full content

    pdf = SeasonPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # Title
    pdf.set_font("Helvetica", "B", 24)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 15, f"Ko {ko_num}", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 10, season["romaji"], new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "I", 14)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 10, f'"{season["english"]}"', new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    # Date and Sekki
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(
        0, 8, f'{season["dates"]} · {season["sekki"]}', new_x="LMARGIN", new_y="NEXT"
    )
    pdf.ln(10)

    # Image (if exists)
    script_dir = Path(__file__).parent
    image_path = script_dir / "images" / season["image"]
    if image_path.exists():
        pdf.image(str(image_path), x=30, w=150)
        pdf.ln(10)

    # Why now?
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 10, "Why now?", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(0, 6, content["why_now"])
    pdf.ln(5)

    # Insight
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, "Insight", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(0, 6, content["insight"])
    pdf.ln(5)

    # Today's practice
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, "Today's practice", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(0, 6, content["practice"])
    pdf.ln(10)

    # Quote
    pdf.set_font("Helvetica", "I", 12)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(0, 7, f'"{content["quote"]}"')
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, f'- {content["quote_author"]}', new_x="LMARGIN", new_y="NEXT")

    # Save
    pdf.output(str(output_path))
    print(f"PDF saved to: {output_path}")


def get_current_ko() -> int:
    """Determine current kō based on today's date."""
    today = date.today()
    month, day = today.month, today.day

    # Simple lookup for current seasons
    if month == 1:
        if 20 <= day <= 24:
            return 70
        elif 25 <= day <= 29:
            return 71
        elif day >= 30 or day <= 3:
            return 72
        elif 5 <= day <= 9:
            return 67
        elif 10 <= day <= 14:
            return 68
        elif 15 <= day <= 19:
            return 69
        elif 1 <= day <= 4:
            return 66

    # Default to 70 for now
    return 70


def main():
    script_dir = Path(__file__).parent

    if len(sys.argv) > 1:
        ko_num = int(sys.argv[1])
    else:
        ko_num = get_current_ko()

    today_str = date.today().isoformat()
    output_path = script_dir / "logs" / f"{today_str}-ko{ko_num}.pdf"
    output_path.parent.mkdir(exist_ok=True)

    generate_pdf(ko_num, output_path)


if __name__ == "__main__":
    main()
