---
name: seasons
description: This skill should be used when the user asks about "what season", "current kō", "micro-season", "72 seasons", "Japanese calendar", "seasonal awareness", or at the start of a session to ground in the present moment.
---

# /seasons

Display the current Japanese micro-season (kō 候) to foster seasonal awareness and connection to nature.

## Instructions

1. **Determine today's date** and find the matching kō from the reference below
2. **Display the current micro-season** in a clean, compact format
3. **Include a brief ELI5 insight** (2-3 sentences max) explaining the natural phenomenon
4. **Add a positive contemplation** that:
   - Connects nature's wisdom to human growth and work
   - Frames challenges as opportunities
   - Suggests an actionable mindset or practice
5. **Include relevant resources** (1-2 links) for deeper exploration

See `sekki-explanations.md` for detailed ELI5 explanations of each solar term.

## Output Format

```
┌─────────────────────────────────────────────────┐
│  第{number}候 · {romaji}                         │
│  "{english translation}"                        │
│                                                 │
│  {date range} · {sekki name} ({sekki english})  │
└─────────────────────────────────────────────────┘

**Why now?** {1-2 sentence ELI5 of the natural phenomenon}

**Insight:** {Positive philosophical musing connecting nature to
work/life—focus on growth, opportunity, patience, timing, etc.}

**Today's practice:** {One small actionable suggestion to embody
this seasonal wisdom in your work}

**Learn more:**
- {Relevant article, video, or resource URL}
- {Optional second resource}
```

## The 72 Kō Reference

### 立春 Risshun (Beginning of Spring)

| #   | Dates     | Japanese | Romaji                | English                     |
| --- | --------- | -------- | --------------------- | --------------------------- |
| 1   | Feb 4-8   | 東風解凍 | Harukaze kōri wo toku | East wind melts the ice     |
| 2   | Feb 9-13  | 黄鶯睍睆 | Kōō kenkan su         | Bush warblers start singing |
| 3   | Feb 14-18 | 魚上氷   | Uo kōri wo izuru      | Fish emerge from the ice    |

### 雨水 Usui (Rainwater)

| #   | Dates     | Japanese | Romaji                    | English                  |
| --- | --------- | -------- | ------------------------- | ------------------------ |
| 4   | Feb 19-23 | 土脉潤起 | Tsuchi no shō uruoi okoru | Rain moistens the soil   |
| 5   | Feb 24-28 | 霞始靆   | Kasumi hajimete tanabiku  | Mist starts to linger    |
| 6   | Mar 1-5   | 草木萌動 | Sōmoku mebae izuru        | Grass sprouts, trees bud |

### 啓蟄 Keichitsu (Awakening of Insects)

| #   | Dates     | Japanese | Romaji                     | English                         |
| --- | --------- | -------- | -------------------------- | ------------------------------- |
| 7   | Mar 6-10  | 蟄虫啓戸 | Sugomori mushito wo hiraku | Hibernating insects surface     |
| 8   | Mar 11-15 | 桃始笑   | Momo hajimete saku         | First peach blossoms            |
| 9   | Mar 16-20 | 菜虫化蝶 | Namushi chō to naru        | Caterpillars become butterflies |

### 春分 Shunbun (Spring Equinox)

| #   | Dates        | Japanese | Romaji                          | English                |
| --- | ------------ | -------- | ------------------------------- | ---------------------- |
| 10  | Mar 21-25    | 雀始巣   | Suzume hajimete sukū            | Sparrows start to nest |
| 11  | Mar 26-30    | 櫻始開   | Sakura hajimete saku            | First cherry blossoms  |
| 12  | Mar 31-Apr 4 | 雷乃発声 | Kaminari sunawachi koe wo hassu | Distant thunder        |

### 清明 Seimei (Clear and Bright)

| #   | Dates     | Japanese | Romaji                | English              |
| --- | --------- | -------- | --------------------- | -------------------- |
| 13  | Apr 5-9   | 玄鳥至   | Tsubame kitaru        | Swallows return      |
| 14  | Apr 10-14 | 鴻雁北   | Kōgan kaeru           | Wild geese fly north |
| 15  | Apr 15-19 | 虹始見   | Niji hajimete arawaru | First rainbows       |

### 穀雨 Kokuu (Grain Rain)

| #   | Dates        | Japanese | Romaji                 | English                         |
| --- | ------------ | -------- | ---------------------- | ------------------------------- |
| 16  | Apr 20-24    | 葭始生   | Ashi hajimete shōzu    | First reeds sprout              |
| 17  | Apr 25-29    | 霜止出苗 | Shimo yamite nae izuru | Last frost, rice seedlings grow |
| 18  | Apr 30-May 4 | 牡丹華   | Botan hana saku        | Peonies bloom                   |

### 立夏 Rikka (Beginning of Summer)

| #   | Dates     | Japanese | Romaji               | English              |
| --- | --------- | -------- | -------------------- | -------------------- |
| 19  | May 5-9   | 蛙始鳴   | Kawazu hajimete naku | Frogs start singing  |
| 20  | May 10-14 | 蚯蚓出   | Mimizu izuru         | Worms surface        |
| 21  | May 15-20 | 竹笋生   | Takenoko shōzu       | Bamboo shoots sprout |

### 小満 Shōman (Grain Buds)

| #   | Dates        | Japanese | Romaji                   | English                              |
| --- | ------------ | -------- | ------------------------ | ------------------------------------ |
| 22  | May 21-25    | 蚕起食桑 | Kaiko okite kuwa wo hamu | Silkworms start feasting on mulberry |
| 23  | May 26-30    | 紅花栄   | Benibana sakau           | Safflowers bloom                     |
| 24  | May 31-Jun 5 | 麦秋至   | Mugi no toki itaru       | Wheat ripens and is harvested        |

### 芒種 Bōshu (Grain in Ear)

| #   | Dates     | Japanese | Romaji                         | English                        |
| --- | --------- | -------- | ------------------------------ | ------------------------------ |
| 25  | Jun 6-10  | 螳螂生   | Kamakiri shōzu                 | Praying mantises hatch         |
| 26  | Jun 11-15 | 腐草為蛍 | Kusaretaru kusa hotaru to naru | Rotten grass becomes fireflies |
| 27  | Jun 16-20 | 梅子黄   | Ume no mi kibamu               | Plums turn yellow              |

### 夏至 Geshi (Summer Solstice)

| #   | Dates        | Japanese | Romaji               | English             |
| --- | ------------ | -------- | -------------------- | ------------------- |
| 28  | Jun 21-26    | 乃東枯   | Natsukarekusa karuru | Self-heal withers   |
| 29  | Jun 27-Jul 1 | 菖蒲華   | Ayame hana saku      | Irises bloom        |
| 30  | Jul 2-6      | 半夏生   | Hange shōzu          | Crow-dipper sprouts |

### 小暑 Shōsho (Minor Heat)

| #   | Dates     | Japanese | Romaji                       | English              |
| --- | --------- | -------- | ---------------------------- | -------------------- |
| 31  | Jul 7-11  | 温風至   | Atsukaze itaru               | Warm winds blow      |
| 32  | Jul 12-16 | 蓮始開   | Hasu hajimete hiraku         | First lotus blossoms |
| 33  | Jul 17-22 | 鷹乃学習 | Taka sunawachi waza wo narau | Hawks learn to fly   |

### 大暑 Taisho (Major Heat)

| #   | Dates        | Japanese | Romaji                       | English                     |
| --- | ------------ | -------- | ---------------------------- | --------------------------- |
| 34  | Jul 23-28    | 桐始結花 | Kiri hajimete hana wo musubu | Paulownia produces seeds    |
| 35  | Jul 29-Aug 2 | 土潤溽暑 | Tsuchi uruōte mushi atsushi  | Earth is damp, air is humid |
| 36  | Aug 3-7      | 大雨時行 | Taiu tokidoki furu           | Great rains sometimes fall  |

### 立秋 Risshū (Beginning of Autumn)

| #   | Dates     | Japanese | Romaji           | English              |
| --- | --------- | -------- | ---------------- | -------------------- |
| 37  | Aug 8-12  | 涼風至   | Suzukaze itaru   | Cool winds blow      |
| 38  | Aug 13-17 | 寒蝉鳴   | Higurashi naku   | Evening cicadas sing |
| 39  | Aug 18-22 | 蒙霧升降 | Fukaki kiri matō | Dense fog descends   |

### 処暑 Shosho (Limit of Heat)

| #   | Dates        | Japanese | Romaji                    | English                 |
| --- | ------------ | -------- | ------------------------- | ----------------------- |
| 40  | Aug 23-27    | 綿柎開   | Wata no hana shibe hiraku | Cotton flowers bloom    |
| 41  | Aug 28-Sep 1 | 天地始粛 | Tenchi hajimete samushi   | Heat starts to die down |
| 42  | Sep 2-7      | 禾乃登   | Kokumono sunawachi minoru | Rice ripens             |

### 白露 Hakuro (White Dew)

| #   | Dates     | Japanese | Romaji                 | English                     |
| --- | --------- | -------- | ---------------------- | --------------------------- |
| 43  | Sep 8-12  | 草露白   | Kusa no tsuyu shiroshi | Dew glistens white on grass |
| 44  | Sep 13-17 | 鶺鴒鳴   | Sekirei naku           | Wagtails sing               |
| 45  | Sep 18-22 | 玄鳥去   | Tsubame saru           | Swallows leave              |

### 秋分 Shūbun (Autumn Equinox)

| #   | Dates        | Japanese | Romaji                          | English                    |
| --- | ------------ | -------- | ------------------------------- | -------------------------- |
| 46  | Sep 23-27    | 雷乃収声 | Kaminari sunawachi koe wo osamu | Thunder ceases             |
| 47  | Sep 28-Oct 2 | 蟄虫坏戸 | Mushi kakurete to wo fusagu     | Insects hide in the ground |
| 48  | Oct 3-7      | 水始涸   | Mizu hajimete karuru            | Farmers drain fields       |

### 寒露 Kanro (Cold Dew)

| #   | Dates     | Japanese | Romaji               | English                    |
| --- | --------- | -------- | -------------------- | -------------------------- |
| 49  | Oct 8-12  | 鴻雁来   | Kōgan kitaru         | Wild geese return          |
| 50  | Oct 13-17 | 菊花開   | Kiku no hana hiraku  | Chrysanthemums bloom       |
| 51  | Oct 18-22 | 蟋蟀在戸 | Kirigirisu to ni ari | Crickets chirp in doorways |

### 霜降 Sōkō (Frost Falls)

| #   | Dates        | Japanese | Romaji               | English                    |
| --- | ------------ | -------- | -------------------- | -------------------------- |
| 52  | Oct 23-27    | 霜始降   | Shimo hajimete furu  | First frost                |
| 53  | Oct 28-Nov 1 | 霎時施   | Kosame tokidoki furu | Light rains sometimes fall |
| 54  | Nov 2-6      | 楓蔦黄   | Momiji tsuta kibamu  | Maples and ivy turn yellow |

### 立冬 Rittō (Beginning of Winter)

| #   | Dates     | Japanese | Romaji                  | English               |
| --- | --------- | -------- | ----------------------- | --------------------- |
| 55  | Nov 7-11  | 山茶始開 | Tsubaki hajimete hiraku | Camellias bloom       |
| 56  | Nov 12-16 | 地始凍   | Chi hajimete kōru       | Land starts to freeze |
| 57  | Nov 17-21 | 金盞香   | Kinsenka saku           | Daffodils bloom       |

### 小雪 Shōsetsu (Minor Snow)

| #   | Dates        | Japanese | Romaji                    | English                 |
| --- | ------------ | -------- | ------------------------- | ----------------------- |
| 58  | Nov 22-26    | 虹蔵不見 | Niji kakurete miezu       | Rainbows hide           |
| 59  | Nov 27-Dec 1 | 朔風払葉 | Kitakaze konoha wo harau  | North wind blows leaves |
| 60  | Dec 2-6      | 橘始黄   | Tachibana hajimete kibamu | Tangerines turn yellow  |

### 大雪 Taisetsu (Major Snow)

| #   | Dates     | Japanese | Romaji                   | English                         |
| --- | --------- | -------- | ------------------------ | ------------------------------- |
| 61  | Dec 7-11  | 閉塞成冬 | Sora samuku fuyu to naru | Cold sets in, winter begins     |
| 62  | Dec 12-16 | 熊蟄穴   | Kuma ana ni komoru       | Bears hibernate                 |
| 63  | Dec 17-21 | 鱖魚群   | Sake no uo muragaru      | Salmon gather and swim upstream |

### 冬至 Tōji (Winter Solstice)

| #   | Dates     | Japanese | Romaji                    | English                  |
| --- | --------- | -------- | ------------------------- | ------------------------ |
| 64  | Dec 22-26 | 乃東生   | Natsukarekusa shōzu       | Self-heal sprouts        |
| 65  | Dec 27-31 | 麋角解   | Sawashika no tsuno otsuru | Deer shed antlers        |
| 66  | Jan 1-4   | 雪下出麦 | Yuki watarite mugi nobiru | Wheat sprouts under snow |

### 小寒 Shōkan (Minor Cold)

| #   | Dates     | Japanese | Romaji                    | English                 |
| --- | --------- | -------- | ------------------------- | ----------------------- |
| 67  | Jan 5-9   | 芹乃栄   | Seri sunawachi sakau      | Parsley flourishes      |
| 68  | Jan 10-14 | 水泉動   | Shimizu atataka wo fukumu | Springs thaw            |
| 69  | Jan 15-19 | 雉始雊   | Kiji hajimete naku        | Pheasants start to call |

### 大寒 Daikan (Major Cold)

| #   | Dates        | Japanese | Romaji                          | English                 |
| --- | ------------ | -------- | ------------------------------- | ----------------------- |
| 70  | Jan 20-24    | 款冬華   | Fuki no hana saku               | Butterburs bud          |
| 71  | Jan 25-29    | 水沢腹堅 | Sawamizu kōri tsumeru           | Ice thickens on streams |
| 72  | Jan 30-Feb 3 | 鶏始乳   | Niwatori hajimete toya ni tsuku | Hens start laying       |

## Resource Library

Use these for the "Learn more" section. Select 1-2 relevant to the current season:

**General 72 Seasons:**

- [72 Seasons Japan (Nippon.com)](https://www.nippon.com/en/features/h00124/)
- [Japanese Microseasons (Wikipedia)](https://en.wikipedia.org/wiki/Japanese_calendar#Seasons)
- [Kurashi no Goyomi App](https://www.kurashikata.com/en/)

**Seasonal Philosophy:**

- [In Praise of Shadows - Tanizaki](https://www.penguin.co.uk/books/57555/in-praise-of-shadows-by-tanizaki-junichiro/9780099283577)
- [Wabi-Sabi for Artists (Leonard Koren)](https://www.leonardkoren.com/wabi-sabi.html)
- [The Book of Tea - Okakura](https://www.gutenberg.org/ebooks/769)

**Nature & Attention:**

- [How to Do Nothing - Jenny Odell](https://www.penguinrandomhouse.com/books/600671/how-to-do-nothing-by-jenny-odell/)
- [Braiding Sweetgrass - Robin Wall Kimmerer](https://milkweed.org/book/braiding-sweetgrass)
- [The Overstory - Richard Powers](https://www.richardpowers.net/the-overstory/)

**Productivity & Natural Rhythms:**

- [Deep Work - Cal Newport](https://www.calnewport.com/books/deep-work/)
- [Rest - Alex Soojung-Kim Pang](https://www.strategy.rest/)
- [Four Thousand Weeks - Oliver Burkeman](https://www.oliverburkeman.com/fourthousandweeks)

**Contemplative Practice:**

- [On the Shortness of Life - Seneca](https://www.gutenberg.org/ebooks/67954)
- [Meditations - Marcus Aurelius](https://www.gutenberg.org/ebooks/2680)
- [Zen Mind, Beginner's Mind - Shunryu Suzuki](https://www.shambhala.com/zen-mind-beginner-s-mind-712.html)

## Contemplation Themes

Match insights to these positive themes based on the season:

| Season Phase | Themes                                              |
| ------------ | --------------------------------------------------- |
| Early Spring | Hidden beginnings, patience, trust in process       |
| Mid Spring   | Emergence, receptivity, opening to growth           |
| Late Spring  | Crossing thresholds, balance points, clarity        |
| Early Summer | Energy arriving, production mode, abundance         |
| Mid Summer   | Full engagement, strategic timing, momentum         |
| Late Summer  | Peak effort, endurance, knowing extremes pass       |
| Early Autumn | Sensing shifts, harvesting, completing              |
| Mid Autumn   | Releasing, revealing, elegant endings               |
| Late Autumn  | Preparing, simplifying, countercyclical opportunity |
| Early Winter | Withdrawal with purpose, essential focus            |
| Mid Winter   | Deep rest, hibernation as strategy, conservation    |
| Late Winter  | Hidden spring, reversal underway, quiet preparation |

## Example Output

For January 22:

```
┌─────────────────────────────────────────────────┐
│  第70候 · Fuki no hana saku                     │
│  "Butterburs bud"                               │
│                                                 │
│  January 20-24 · 大寒 Daikan (Major Cold)       │
└─────────────────────────────────────────────────┘

**Why now?** While air is coldest, soil stays warmer underground.
The butterbur taps this hidden warmth, blooming before competitors
wake—first-mover advantage in nature's economy.

**Insight:** The coldest days come *after* the solstice turn, not
before. Light has been returning for a month—the reversal is
already underway, even when conditions feel hardest. This is the
"hidden spring": change begins before evidence appears.

**Today's practice:** Identify one project that's quietly building
momentum beneath the surface. Give it 15 minutes of attention—
water roots that others can't see yet.

**Learn more:**
- [72 Seasons Japan](https://www.nippon.com/en/features/h00124/)
- [The Hidden Spring (Aeon)](https://aeon.co/essays/japans-72-microseasons-offer-a-meditative-way-to-mark-time)
```
