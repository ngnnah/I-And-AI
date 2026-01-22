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
5. **Select a quote** from the Quotes Library that matches the season/theme
6. **Include relevant resources** (1-2 links) for deeper exploration
7. **Save output to log file**: `./logs/YYYY-MM-DD.md`

See `sekki-explanations.md` for detailed ELI5 explanations of each solar term.

## Output Format

```
## 第{number}候 · {romaji}
### "{english translation}"

> {date range} · {sekki name} ({sekki english})

<!-- If local image exists: ![{alt}](./images/{number}-{slug}.jpg) -->
<!-- NOTE: In log files (./logs/), use ../images/ path instead -->

**Why now?** {1-2 sentence ELI5 of the natural phenomenon}

**Insight:** {Positive philosophical musing connecting nature to
work/life—focus on growth, opportunity, patience, timing, etc.}

**Today's practice:** {One small actionable suggestion to embody
this seasonal wisdom in your work}

> **💬** "{Relevant quote from the library below}"
> — {Author}

**Learn more:**
- {Relevant article, video, or resource URL}
- {Optional second resource}
```

## Images & Resources

This skill is self-contained with local images and curated URLs.

### Image Strategy

1. **Local images only**: Check for `./images/{number}-{romaji-slug}.jpg`
2. **If exists**: Include in output with `![alt](./images/...)`
3. **If missing**: Omit image from output (no external URLs)
4. **In log files**: Use `../images/...` (logs are in `./logs/` subdirectory)

### Local Images

- Stored in: `./images/{number}-{romaji-slug}.jpg`
- Example: `./images/70-fuki-no-hana-saku.jpg`
- Git-tracked for portability
- See `./images/.gitkeep` for manual download instructions

### Curated URLs

- See `./resources.md` for specific "Learn more" URLs for each kō
- Each micro-season has a validated Wikipedia/Japan Guide link
- Image source URLs listed for manual download

### Adding New Images

1. Find image on Wikimedia Commons for the plant/phenomenon
2. Right-click image > "Save Image As..."
3. Rename to: `{number}-{romaji-slug}.jpg`
4. Save to `./images/` folder
5. Recommended: 640px width for fast loading

## Logging

Each /seasons output is saved as a markdown log file for tracking over time.

### Log Location

`./logs/YYYY-MM-DD.md`

Example: `./logs/2026-01-22.md`

### Log Format

Save the complete output to the log file. One file per day.

**Important:** Use `../images/` for image paths in logs (not `./images/`).

### Purpose

- Build a personal seasonal journal
- Track contemplations and practices over time
- Review patterns across seasons
- Git-tracked for history

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

## Quotes Library

Select one quote that resonates with the current season's theme:

### Spring (Beginnings, Growth, Emergence)

| Quote                                                                                      | Author              |
| ------------------------------------------------------------------------------------------ | ------------------- |
| "In the depth of winter, I finally learned that within me there lay an invincible summer." | Albert Camus        |
| "No winter lasts forever; no spring skips its turn."                                       | Hal Borland         |
| "Spring passes and one remembers one's innocence."                                         | Yoko Ono            |
| "The earth laughs in flowers."                                                             | Ralph Waldo Emerson |
| "If we had no winter, the spring would not be so pleasant."                                | Anne Bradstreet     |
| "Adopt the pace of nature: her secret is patience."                                        | Ralph Waldo Emerson |

### Summer (Energy, Abundance, Full Engagement)

| Quote                                                                                                                   | Author              |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------- |
| "Live in the sunshine, swim the sea, drink the wild air."                                                               | Ralph Waldo Emerson |
| "Rest is not idleness, and to lie sometimes on the grass under trees on a summer's day is by no means a waste of time." | John Lubbock        |
| "Summer afternoon—summer afternoon; to me those have always been the two most beautiful words in the English language." | Henry James         |
| "One must maintain a little bit of summer, even in the middle of winter."                                               | Henry David Thoreau |
| "Deep summer is when laziness finds respectability."                                                                    | Sam Keen            |

### Autumn (Harvest, Release, Transition)

| Quote                                                                                                | Author              |
| ---------------------------------------------------------------------------------------------------- | ------------------- |
| "Autumn is a second spring when every leaf is a flower."                                             | Albert Camus        |
| "Life starts all over again when it gets crisp in the fall."                                         | F. Scott Fitzgerald |
| "Notice that autumn is more the season of the soul than of nature."                                  | Friedrich Nietzsche |
| "Every leaf speaks bliss to me, fluttering from the autumn tree."                                    | Emily Brontë        |
| "There is something incredibly nostalgic and significant about the annual cascade of autumn leaves." | Joe L. Wheeler      |
| "Simplicity is the ultimate sophistication."                                                         | Leonardo da Vinci   |

### Winter (Rest, Depth, Hidden Preparation)

| Quote                                                                                                                                                       | Author             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| "The snow itself is lonely or, if you prefer, self-sufficient. There is no other time when the whole world seems composed of one thing and one thing only." | Joseph Wood Krutch |
| "What good is the warmth of summer, without the cold of winter to give it sweetness."                                                                       | John Steinbeck     |
| "In seed time learn, in harvest teach, in winter enjoy."                                                                                                    | William Blake      |
| "Winter is the time for comfort, for good food and warmth, for the touch of a friendly hand and for a talk beside the fire."                                | Edith Sitwell      |
| "To appreciate the beauty of a snowflake it is necessary to stand out in the cold."                                                                         | Aristotle          |
| "The pine stays green in winter... wisdom in hardship."                                                                                                     | Norman Douglas     |

### Universal (Any Season)

| Quote                                                                                   | Author             |
| --------------------------------------------------------------------------------------- | ------------------ |
| "Nature does not hurry, yet everything is accomplished."                                | Lao Tzu            |
| "Look deep into nature, and then you will understand everything better."                | Albert Einstein    |
| "In every walk with nature one receives far more than he seeks."                        | John Muir          |
| "The clearest way into the Universe is through a forest wilderness."                    | John Muir          |
| "Study nature, love nature, stay close to nature. It will never fail you."              | Frank Lloyd Wright |
| "Attention is the rarest and purest form of generosity."                                | Simone Weil        |
| "The world is full of magic things, patiently waiting for our senses to grow sharper."  | W.B. Yeats         |
| "Between stimulus and response there is a space. In that space is our power to choose." | Viktor Frankl      |

### Playful & Fun

| Quote                                                                                             | Author              |
| ------------------------------------------------------------------------------------------------- | ------------------- |
| "I like trees because they seem more resigned to the way they have to live than other things do." | Willa Cather        |
| "Do not go where the path may lead, go instead where there is no path and leave a trail."         | Ralph Waldo Emerson |
| "Instructions for living a life: Pay attention. Be astonished. Tell about it."                    | Mary Oliver         |
| "The creation of a thousand forests is in one acorn."                                             | Ralph Waldo Emerson |
| "Not all those who wander are lost."                                                              | J.R.R. Tolkien      |
| "I took a walk in the woods and came out taller than the trees."                                  | Henry David Thoreau |

## Example Output

For January 22:

## 第70候 · Fuki no hana saku

### "Butterburs bud"

> January 20-24 · 大寒 Daikan (Major Cold)

**Why now?** While air is coldest, soil stays warmer underground. The butterbur taps this hidden warmth, blooming before competitors wake—first-mover advantage in nature's economy.

**Insight:** The coldest days come _after_ the solstice turn, not before. Light has been returning for a month—the reversal is already underway, even when conditions feel hardest. This is the "hidden spring": change begins before evidence appears.

**Today's practice:** Identify one project that's quietly building momentum beneath the surface. Give it 15 minutes of attention—water roots that others can't see yet.

> **💬** "In the depth of winter, I finally learned that within me there lay an invincible summer."
> — Albert Camus

**Learn more:**

- [Butterbur (Petasites japonicus)](https://en.wikipedia.org/wiki/Petasites_japonicus)
- [Daikan - Coldest Period](https://www.nippon.com/en/features/h00124/)
