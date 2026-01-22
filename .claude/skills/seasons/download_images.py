#!/usr/bin/env python3
"""Download images for the 72 Japanese micro-seasons.

Usage:
    uv run download_images.py          # Download all missing images
    uv run download_images.py 70       # Download specific kō number
    uv run download_images.py 70 71 72 # Download multiple kō numbers
"""

import sys
import urllib.request
from pathlib import Path

# Image sources for each kō (number: (filename, url))
# Using Wikimedia Commons with working URLs
IMAGES = {
    # Daikan (Major Cold) - Jan 20-Feb 3
    70: (
        "70-fuki-no-hana-saku.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Petasites_japonicus_20080314.jpg/640px-Petasites_japonicus_20080314.jpg",
    ),
    71: (
        "71-sawamizu-kori-tsumeru.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Frozen_creek_in_Lamar_Valley.jpg/640px-Frozen_creek_in_Lamar_Valley.jpg",
    ),
    72: (
        "72-niwatori-hajimete-toya-ni-tsuku.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Female_pair.jpg/640px-Female_pair.jpg",
    ),
    # Shōkan (Minor Cold) - Jan 5-19
    67: (
        "67-seri-sunawachi-sakau.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Oenanthe_javanica1.jpg/640px-Oenanthe_javanica1.jpg",
    ),
    68: (
        "68-shimizu-atataka-wo-fukumu.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Hot_spring_in_Iceland.jpg/640px-Hot_spring_in_Iceland.jpg",
    ),
    69: (
        "69-kiji-hajimete-naku.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Phasianus_versicolor_-Japan_-male-8.jpg/640px-Phasianus_versicolor_-Japan_-male-8.jpg",
    ),
    # Tōji (Winter Solstice) - Dec 22-Jan 4
    64: (
        "64-natsukarekusa-shozu.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Prunella_vulgaris_-_hass%C3%A4%C3%A4re.jpg/640px-Prunella_vulgaris_-_hass%C3%A4%C3%A4re.jpg",
    ),
    65: (
        "65-sawashika-no-tsuno-otsuru.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Deer_Antler.jpg/640px-Deer_Antler.jpg",
    ),
    66: (
        "66-yuki-watarite-mugi-nobiru.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Winter_wheat.jpg/640px-Winter_wheat.jpg",
    ),
    # Sakura (Cherry Blossoms) - example spring
    11: (
        "11-sakura-hajimete-saku.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Cherry_blossoms_in_Vancouver_3_crop.jpg/640px-Cherry_blossoms_in_Vancouver_3_crop.jpg",
    ),
}


def download_image(ko_num: int, images_dir: Path) -> bool:
    """Download image for a specific kō number."""
    if ko_num not in IMAGES:
        print(f"  No image URL configured for kō {ko_num}")
        return False

    filename, url = IMAGES[ko_num]
    filepath = images_dir / filename

    if filepath.exists():
        print(f"  {filename} already exists, skipping")
        return True

    print(f"  Downloading {filename}...")
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            },
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read()
            # Verify it's actually an image (JPEG starts with FFD8)
            if data[:2] != b"\xff\xd8":
                print(f"  Warning: {filename} may not be a valid JPEG")
            filepath.write_bytes(data)
            print(f"  Saved {filename} ({len(data):,} bytes)")
            return True
    except Exception as e:
        print(f"  Failed to download {filename}: {e}")
        return False


def main():
    script_dir = Path(__file__).parent
    images_dir = script_dir / "images"
    images_dir.mkdir(exist_ok=True)

    # Determine which kō to download
    if len(sys.argv) > 1:
        ko_numbers = [int(arg) for arg in sys.argv[1:]]
    else:
        ko_numbers = list(IMAGES.keys())

    print(f"Downloading images to {images_dir}")
    print(f"Kō numbers: {ko_numbers}")
    print()

    success = 0
    for ko_num in ko_numbers:
        if download_image(ko_num, images_dir):
            success += 1

    print()
    print(f"Downloaded {success}/{len(ko_numbers)} images")


if __name__ == "__main__":
    main()
