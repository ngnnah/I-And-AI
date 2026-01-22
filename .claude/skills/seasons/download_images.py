#!/usr/bin/env python3
"""Download images for the 72 Japanese micro-seasons from Unsplash.

Usage:
    uv run download_images.py          # Download all missing images
    uv run download_images.py 70       # Download specific kō number
    uv run download_images.py 70 71 72 # Download multiple kō numbers

Setup:
    1. Sign up at https://unsplash.com/developers (free)
    2. Create an app to get your Access Key
    3. Set environment variable: export UNSPLASH_ACCESS_KEY="your-key-here"
"""

import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

UNSPLASH_ACCESS_KEY = os.environ.get("UNSPLASH_ACCESS_KEY", "")

# Search terms and filenames for each kō
# Format: ko_number: (filename, search_query)
SEASONS = {
    # 立春 Risshun (Beginning of Spring) - Feb 4-18
    1: ("01-harukaze-kori-wo-toku.jpg", "melting ice spring"),
    2: ("02-koo-kenkan-su.jpg", "japanese bush warbler bird"),
    3: ("03-uo-kori-wo-izuru.jpg", "fish under ice winter"),
    # 雨水 Usui (Rainwater) - Feb 19-Mar 5
    4: ("04-tsuchi-no-sho-uruoi-okoru.jpg", "rain wet soil spring"),
    5: ("05-kasumi-hajimete-tanabiku.jpg", "morning mist valley"),
    6: ("06-somoku-mebae-izuru.jpg", "tree buds spring sprouting"),
    # 啓蟄 Keichitsu (Awakening of Insects) - Mar 6-20
    7: ("07-sugomori-mushito-wo-hiraku.jpg", "insects emerging spring"),
    8: ("08-momo-hajimete-saku.jpg", "peach blossom pink flower"),
    9: ("09-namushi-cho-to-naru.jpg", "butterfly metamorphosis"),
    # 春分 Shunbun (Spring Equinox) - Mar 21-Apr 4
    10: ("10-suzume-hajimete-suku.jpg", "sparrow nest building"),
    11: ("11-sakura-hajimete-saku.jpg", "cherry blossom japan sakura"),
    12: ("12-kaminari-sunawachi-koe-wo-hassu.jpg", "spring thunder storm"),
    # 清明 Seimei (Clear and Bright) - Apr 5-19
    13: ("13-tsubame-kitaru.jpg", "barn swallow bird"),
    14: ("14-kogan-kaeru.jpg", "wild geese flying migration"),
    15: ("15-niji-hajimete-arawaru.jpg", "rainbow nature"),
    # 穀雨 Kokuu (Grain Rain) - Apr 20-May 4
    16: ("16-ashi-hajimete-shozu.jpg", "reeds wetland spring"),
    17: ("17-shimo-yamite-nae-izuru.jpg", "rice seedlings paddy"),
    18: ("18-botan-hana-saku.jpg", "peony flower bloom"),
    # 立夏 Rikka (Beginning of Summer) - May 5-20
    19: ("19-kawazu-hajimete-naku.jpg", "japanese tree frog green"),
    20: ("20-mimizu-izuru.jpg", "earthworm soil"),
    21: ("21-takenoko-shozu.jpg", "bamboo shoots forest"),
    # 小満 Shōman (Grain Buds) - May 21-Jun 5
    22: ("22-kaiko-okite-kuwa-wo-hamu.jpg", "silkworm mulberry leaves"),
    23: ("23-benibana-sakau.jpg", "safflower orange bloom"),
    24: ("24-mugi-no-toki-itaru.jpg", "wheat field golden harvest"),
    # 芒種 Bōshu (Grain in Ear) - Jun 6-20
    25: ("25-kamakiri-shozu.jpg", "praying mantis green"),
    26: ("26-kusaretaru-kusa-hotaru-to-naru.jpg", "firefly night japan"),
    27: ("27-ume-no-mi-kibamu.jpg", "japanese plum ume fruit"),
    # 夏至 Geshi (Summer Solstice) - Jun 21-Jul 6
    28: ("28-natsukarekusa-karuru.jpg", "self heal plant purple flower"),
    29: ("29-ayame-hana-saku.jpg", "iris flower purple japanese"),
    30: ("30-hange-shozu.jpg", "pinellia plant green"),
    # 小暑 Shōsho (Minor Heat) - Jul 7-22
    31: ("31-atsukaze-itaru.jpg", "summer wind warm breeze"),
    32: ("32-hasu-hajimete-hiraku.jpg", "lotus flower pink bloom"),
    33: ("33-taka-sunawachi-waza-wo-narau.jpg", "hawk flying learning"),
    # 大暑 Taisho (Major Heat) - Jul 23-Aug 7
    34: ("34-kiri-hajimete-hana-wo-musubu.jpg", "paulownia tree seeds"),
    35: ("35-tsuchi-uruote-mushi-atsushi.jpg", "humid summer earth"),
    36: ("36-taiu-tokidoki-furu.jpg", "summer rain storm"),
    # 立秋 Risshū (Beginning of Autumn) - Aug 8-22
    37: ("37-suzukaze-itaru.jpg", "cool autumn breeze"),
    38: ("38-higurashi-naku.jpg", "cicada evening tree"),
    39: ("39-fukaki-kiri-mato.jpg", "dense fog morning"),
    # 処暑 Shosho (Limit of Heat) - Aug 23-Sep 7
    40: ("40-wata-no-hana-shibe-hiraku.jpg", "cotton flower bloom white"),
    41: ("41-tenchi-hajimete-samushi.jpg", "late summer sunset field"),
    42: ("42-kokumono-sunawachi-minoru.jpg", "rice field golden ripe"),
    # 白露 Hakuro (White Dew) - Sep 8-22
    43: ("43-kusa-no-tsuyu-shiroshi.jpg", "morning dew grass droplets"),
    44: ("44-sekirei-naku.jpg", "wagtail bird"),
    45: ("45-tsubame-saru.jpg", "swallows migrating autumn"),
    # 秋分 Shūbun (Autumn Equinox) - Sep 23-Oct 7
    46: ("46-kaminari-sunawachi-koe-wo-osamu.jpg", "autumn sky quiet"),
    47: ("47-mushi-kakurete-to-wo-fusagu.jpg", "insects hiding autumn"),
    48: ("48-mizu-hajimete-karuru.jpg", "rice paddy draining"),
    # 寒露 Kanro (Cold Dew) - Oct 8-22
    49: ("49-kogan-kitaru.jpg", "wild geese returning autumn"),
    50: ("50-kiku-no-hana-hiraku.jpg", "chrysanthemum flower japanese"),
    51: ("51-kirigirisu-to-ni-ari.jpg", "cricket insect autumn"),
    # 霜降 Sōkō (Frost Falls) - Oct 23-Nov 6
    52: ("52-shimo-hajimete-furu.jpg", "first frost morning"),
    53: ("53-kosame-tokidoki-furu.jpg", "light rain autumn drizzle"),
    54: ("54-momiji-tsuta-kibamu.jpg", "maple leaves red autumn japan"),
    # 立冬 Rittō (Beginning of Winter) - Nov 7-21
    55: ("55-tsubaki-hajimete-hiraku.jpg", "camellia flower red japanese"),
    56: ("56-chi-hajimete-koru.jpg", "frozen ground frost"),
    57: ("57-kinsenka-saku.jpg", "daffodil winter bloom"),
    # 小雪 Shōsetsu (Minor Snow) - Nov 22-Dec 6
    58: ("58-niji-kakurete-miezu.jpg", "winter sky grey clouds"),
    59: ("59-kitakaze-konoha-wo-harau.jpg", "wind blowing leaves autumn"),
    60: ("60-tachibana-hajimete-kibamu.jpg", "tangerine citrus orange fruit"),
    # 大雪 Taisetsu (Major Snow) - Dec 7-21
    61: ("61-sora-samuku-fuyu-to-naru.jpg", "winter cold sky snow"),
    62: ("62-kuma-ana-ni-komoru.jpg", "bear hibernating cave"),
    63: ("63-sake-no-uo-muragaru.jpg", "salmon swimming upstream"),
    # 冬至 Tōji (Winter Solstice) - Dec 22-Jan 4
    64: ("64-natsukarekusa-shozu.jpg", "self heal plant winter sprout"),
    65: ("65-sawashika-no-tsuno-otsuru.jpg", "deer antler shedding"),
    66: ("66-yuki-watarite-mugi-nobiru.jpg", "wheat sprout snow winter"),
    # 小寒 Shōkan (Minor Cold) - Jan 5-19
    67: ("67-seri-sunawachi-sakau.jpg", "japanese parsley herb green"),
    68: ("68-shimizu-atataka-wo-fukumu.jpg", "natural spring water flowing"),
    69: ("69-kiji-hajimete-naku.jpg", "pheasant bird colorful"),
    # 大寒 Daikan (Major Cold) - Jan 20-Feb 3
    70: ("70-fuki-no-hana-saku.jpg", "butterbur flower winter japan"),
    71: ("71-sawamizu-kori-tsumeru.jpg", "frozen stream ice winter"),
    72: ("72-niwatori-hajimete-toya-ni-tsuku.jpg", "hen chicken eggs"),
}


def search_unsplash(query: str) -> str | None:
    """Search Unsplash and return the first image URL."""
    if not UNSPLASH_ACCESS_KEY:
        print("  Warning: UNSPLASH_ACCESS_KEY not set")
        return None

    url = f"https://api.unsplash.com/search/photos?query={urllib.parse.quote(query)}&per_page=1&orientation=landscape"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}",
            "Accept-Version": "v1",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode())
            if data.get("results"):
                # Get the regular size (1080px width)
                return data["results"][0]["urls"]["regular"]
    except Exception as e:
        print(f"  Unsplash search failed: {e}")

    return None


def download_image(url: str, filepath: Path) -> bool:
    """Download image from URL to filepath."""
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
            filepath.write_bytes(data)
            print(f"  Saved {filepath.name} ({len(data):,} bytes)")
            return True
    except Exception as e:
        print(f"  Download failed: {e}")
        return False


def process_ko(ko_num: int, images_dir: Path) -> bool:
    """Download image for a specific kō number."""
    if ko_num not in SEASONS:
        print(f"  No config for kō {ko_num}")
        return False

    filename, search_query = SEASONS[ko_num]
    filepath = images_dir / filename

    if filepath.exists():
        print(f"  {filename} already exists, skipping")
        return True

    print(f"  Searching Unsplash for: {search_query}")
    image_url = search_unsplash(search_query)

    if image_url:
        return download_image(image_url, filepath)
    else:
        print(f"  No image found for kō {ko_num}")
        return False


def main():
    script_dir = Path(__file__).parent
    images_dir = script_dir / "images"
    images_dir.mkdir(exist_ok=True)

    if not UNSPLASH_ACCESS_KEY:
        print("ERROR: UNSPLASH_ACCESS_KEY environment variable not set")
        print()
        print("Setup:")
        print("  1. Sign up at https://unsplash.com/developers (free)")
        print("  2. Create an app to get your Access Key")
        print("  3. Run: export UNSPLASH_ACCESS_KEY='your-key-here'")
        print()
        sys.exit(1)

    # Determine which kō to download
    if len(sys.argv) > 1:
        ko_numbers = [int(arg) for arg in sys.argv[1:]]
    else:
        ko_numbers = list(SEASONS.keys())

    print(f"Downloading images to {images_dir}")
    print(f"Kō numbers: {ko_numbers}")
    print()

    success = 0
    for ko_num in ko_numbers:
        print(f"Kō {ko_num}:")
        if process_ko(ko_num, images_dir):
            success += 1
        print()

    print(f"Downloaded {success}/{len(ko_numbers)} images")


if __name__ == "__main__":
    main()
