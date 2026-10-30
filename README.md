# LingaloKR

Learn **Korean**: Hangul, numbers, and everyday words, with spaced repetition so you actually remember them.

**Live site: [https://ijme.tk/LingaloKOREAN/](https://ijme.tk/LingaloKOREAN/#/home)**

## Screens

| Screen | What it's for |
| --- | --- |
| **Welcome** | First visit only: asks what to call you, then where to start (brand new, already reads Hangul, or just look around). |
| **Home** | A greeting by name, today's plan (due reviews, the next lesson, a skill drill) with one **Start** button, the daily goal and streak, and shortcuts to the course, words and progress. |
| **Learn** | **Course:** 41 lessons in four units (Read Hangul, First words, Sentences, Conversations), each ending in a unit test, plus an optional **Your class** track covering the class word list ten words at a time. Lessons open with explanation cards (block diagrams, tables, dialogues), teach each item, then mix exercises. Score 60% to finish a lesson; pass a unit test (80%) to complete the whole unit, so you can test out of Hangul. **Grammar notes:** every explanation card, searchable. **Hangul tools:** a block builder and a chart with a mnemonic for every letter. |
| **Practice** | Pick topics (grouped and collapsible) and a way to practice. The four main modes are up front; the rest and the options are tucked away. Links to number drills. |
| **Progress** | Streak and freezes, level, words mastered, activity chart and calendar, course and skill progress, and achievements. |
| **Numbers** | Reached from Practice. Sino-Korean vs. native numbers, a number reader (type any number to hear it in Korean), and drills for prices, time, counting, age, and dates. |
| **Words** | Browse and search every word with example sentences. Filter by new, due, or mastered. Add your own words here. |
| **Settings** | The gear in the header. Your name, theme, sound, speech speed, which exercises appear in lessons, daily goal, transfer code, backup, and reset. |

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
- **Speaking:** say the word; the browser's speech recognition checks it. Free, built into Chrome, Edge and Safari (not Firefox). The browser sends the audio to its own speech service to recognize it.
- **Hangul typing:** see the meaning, type the Korean on an on-screen keyboard, or on your own keyboard by key position (no Korean input method needed).
- **Writing:** watch the stroke order, then trace the letter with a finger, pen or mouse.

## Lesson exercises

Lessons mix: multiple choice, Korean from English, listening, speaking, tracing letters, Hangul typing, building syllable blocks from letter tiles, putting words in order (with a trap word that has the wrong particle), filling in particles (을/를, 은/는, 이/가, 에/에서) with the rule explained, and choosing the next line in a conversation.

## Motivation

- **Today's plan** on Home: due reviews, the next lesson, and a rotating skill drill (speaking, typing, writing or listening).
- **Streak freezes:** every 7 days of streak earns one (up to 2); a freeze covers a single missed day automatically.
- **Achievements** for lessons, units, streaks, words mastered, and each skill.

## Spaced repetition

Each word gets a review date. A right answer pushes it out (1 day, then 3, then longer each time); a miss brings it back today. Home shows what's due.

## Data

Progress is stored in your browser (`localStorage`, key `lingalo_stats_v4`, so earlier Lingalo progress carries over). To move to another device, use **Settings → Transfer code** (copy on one device, paste on the other) or a backup file. There's no account or automatic sync.

## Files

- `index.html`: page shell and icons
- `css/styles.css`: all styles (light and dark themes)
- `js/hangul.js`: romanization, syllable blocks, keyboard composition, particles, and Korean number readings
- `js/data.js`: topics, words, sentences, and letter mnemonics
- `js/lessons.js`: the guided course (units, lessons, explanation cards, class track)
- `js/strokes.js`: stroke order for every letter
- `js/speaking.js`, `js/writing.js`, `js/keyboard.js`: speaking, tracing, and Hangul typing exercises
- `js/achievements.js`: achievements, today's plan, and the progress panel
- `js/korean_class_words.js`: class word list
- `js/examples.js`: example sentences
- `js/app.js`: app logic
- `sw.js`, `manifest.json`: offline support and install-as-app

No build step. Serve the folder with any static server, or push it to GitHub Pages.

Run `node tests/check.js` to check that every lesson, letter and helper still holds together.
