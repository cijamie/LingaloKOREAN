# LingaloKR

Learn **Korean**: Hangul, numbers, and everyday words, with spaced repetition so you actually remember them.

**Live demo: [https://cijamie.github.io/lingalo/](https://cijamie.github.io/lingalo/)**

## Screens

| Screen | What it's for |
| --- | --- |
| **Home** | Review what's due today, your daily goal, streak and level, an activity chart and practice calendar, and every topic with a one-tap **Practice** button. |
| **Learn** | A guided course of 38 lessons in four units: Read Hangul, First words, Sentences (grammar), and Conversations. Lessons open with short explanation cards (block diagrams, tables, dialogues), teach each item, then mix exercises: multiple choice, Korean from English, listening, building syllable blocks from letter tiles, and putting words in sentence order. Score 60% to finish a lesson. The page also has a block builder and a Hangul chart with a mnemonic for every letter. |
| **Practice** | Pick topics, a study mode, and options. Words due for review always come first. |
| **Numbers** | Sino-Korean vs. native numbers, a number reader (type any number to hear it in Korean), and drills for prices, time, counting, age, and dates. |
| **Words** | Browse and search every word with example sentences. Filter by new, due, or mastered. Add your own words here. |
| **Settings** | Theme, sound, speech speed, daily goal, transfer code, backup, and reset. |

## Content

- **Hangul:** consonants, vowels, double consonants, combined vowels, syllable blocks, with a visual mnemonic for every letter (ㄱ = **G**un, ㄴ = **N**ose…)
- **Numbers:** Sino-Korean, native Korean, counters, months, plus generated drills
- **Vocabulary:** phrases, core words, food, family, body, time and days, colors, verbs, adjectives, places, travel, school
- **Class lessons:** 336 words from Lessons 1–10 and Reading (from `Word Bank/wordfile.xlsx`)
- **Sentences:** basic sentences, verb forms (present, past, negative, wanting), questions and requests, and conversation lines used by the guided course
- **My words:** anything you add, translated and romanized automatically

## Study modes

- **Quiz:** four choices; keys `1`–`4`.
- **Flashcards:** `Space` to flip, then `1` Again / `2` Good / `3` Easy.
- **Listening:** hear the word, pick its meaning. Needs a Korean voice (built into Chrome and Edge).
- **Typing:** type the romanization. Both the standard spelling and the listed one are accepted.
- **Speed sprint:** 60 seconds.
- **Match pairs:** six pairs at a time.

## Spaced repetition

Each word gets a review date. A right answer pushes it out (1 day, then 3, then longer each time); a miss brings it back today. Home shows what's due.

## Data

Progress is stored in your browser (`localStorage`, key `lingalo_stats_v4`, so earlier Lingalo progress carries over). To move to another device, use **Settings → Transfer code** (copy on one device, paste on the other) or a backup file. There's no account or automatic sync.

## Files

- `index.html`: page shell and icons
- `css/styles.css`: all styles (light and dark themes)
- `js/hangul.js`: romanization, syllable block split/join, and Korean number readings
- `js/data.js`: topics, words, and letter mnemonics
- `js/lessons.js`: the guided course (units, lessons, explanation cards)
- `js/korean_class_words.js`: class word list
- `js/examples.js`: example sentences
- `js/app.js`: app logic
- `sw.js`, `manifest.json`: offline support and install-as-app

No build step. Serve the folder with any static server, or push it to GitHub Pages.
