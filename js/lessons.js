// LingaloKR guided path: Hangul first, then first words.
// Each lesson teaches a few items, then quizzes them.
// items are [topicId, [keys]] pairs pointing into TOPICS (data.js).

const LESSONS = [
    /* ---- Hangul ---- */
    {
        id: 'h1', unit: 'Read Hangul', title: 'Six simple vowels', desc: 'ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ',
        intro: ['Every vowel is a long line plus, usually, a short stroke.', 'Watch which way the short stroke points: away, in, over, or under.'],
        items: [['vowels', ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ']]]
    },
    {
        id: 'h2', unit: 'Read Hangul', title: 'First consonants', desc: 'ㄱ ㄴ ㄷ ㄹ ㅁ',
        intro: ['Each consonant comes with a picture to hang its sound on.', 'Several have two sounds: ㄱ is closer to g at the start of a word and k at the end.'],
        items: [['consonants', ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ']]]
    },
    {
        id: 'h3', unit: 'Read Hangul', title: 'More consonants', desc: 'ㅂ ㅅ ㅇ ㅈ ㅎ',
        intro: ['ㅇ is special: silent at the top of a block, "ng" at the bottom.'],
        items: [['consonants', ['ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅎ']]]
    },
    {
        id: 'h4', unit: 'Read Hangul', title: 'Breathy consonants', desc: 'ㅊ ㅋ ㅌ ㅍ',
        intro: ['An extra stroke usually means an extra puff of air.', 'ㄱ → ㅋ, ㄷ → ㅌ, ㅈ → ㅊ, and ㅂ → ㅍ.'],
        items: [['consonants', ['ㅊ', 'ㅋ', 'ㅌ', 'ㅍ']]]
    },
    {
        id: 'h5', unit: 'Read Hangul', title: 'Y vowels', desc: 'ㅑ ㅕ ㅛ ㅠ',
        intro: ['The Y rule: a second short stroke adds a "y" to the front.', 'ㅏ → ㅑ (ya), ㅓ → ㅕ (yeo), ㅗ → ㅛ (yo), ㅜ → ㅠ (yu).'],
        items: [['vowels', ['ㅑ', 'ㅕ', 'ㅛ', 'ㅠ']]]
    },
    {
        id: 'h6', unit: 'Read Hangul', title: 'Building blocks', desc: '가 나 고 수 아',
        intro: ['Letters stack into square syllable blocks: consonant first, then vowel.', 'Tall vowels (ㅏ ㅓ ㅣ) sit to the right. Flat vowels (ㅗ ㅜ ㅡ) sit underneath.', 'A block never starts with a vowel, so silent ㅇ fills the spot: 아 is just "a".'],
        items: [['syllables', ['가', '나', '다', '마', '아', '고', '노', '수', '기', '서', '으', '하']]]
    },
    {
        id: 'h7', unit: 'Read Hangul', title: 'Double consonants', desc: 'ㄲ ㄸ ㅃ ㅆ ㅉ',
        intro: ['Doubling a letter makes it tense: tighten your throat and say it sharply, with no puff of air.'],
        items: [['doubleConsonants', ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ']]]
    },
    {
        id: 'h8', unit: 'Read Hangul', title: 'Vowels + ㅣ', desc: 'ㅐ ㅔ ㅒ ㅖ',
        intro: ['Adding ㅣ to ㅏ or ㅓ makes an "eh" sound.', 'Most speakers say ㅐ and ㅔ the same way, so you learn which one by spelling.'],
        items: [['diphthongs', ['ㅐ', 'ㅔ', 'ㅒ', 'ㅖ']]]
    },
    {
        id: 'h9', unit: 'Read Hangul', title: 'W vowels', desc: 'ㅘ ㅝ ㅚ ㅟ ㅢ',
        intro: ['ㅗ or ㅜ in front of another vowel makes a "w" glide.', 'Read the parts left to right and say them quickly: ㅗ + ㅏ = wa.'],
        items: [['diphthongs', ['ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ']]]
    },
    {
        id: 'h10', unit: 'Read Hangul', title: 'Your first words', desc: '우유 바다 물 밥',
        intro: ['Put the blocks together and you can read words.', 'A consonant under the vowel is a final (받침). Finals boil down to seven sounds: k, n, t, l, m, p, ng.'],
        items: [['vocabulary', ['우유', '아이', '오이', '바다', '나라', '모자', '물', '달']], ['food', ['밥']], ['places', ['집']], ['school', ['책']]]
    },

    /* ---- First words ---- */
    {
        id: 'w1', unit: 'First words', title: 'Greetings', desc: '안녕하세요, 감사합니다',
        intro: ['These polite forms work with almost anyone.', 'There are two goodbyes: one for the person leaving and one for the person staying.'],
        items: [['travel', ['안녕하세요', '감사합니다']], ['phrases', ['네', '아니요', '죄송합니다', '괜찮아요', '안녕히 가세요', '안녕히 계세요']]]
    },
    {
        id: 'w2', unit: 'First words', title: 'Numbers 1–10', desc: '일 이 삼 사 오',
        intro: ['These are Sino-Korean numbers, used for money, dates, minutes, and phone numbers.'],
        items: [['num_sino', ['일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십']]]
    },
    {
        id: 'w3', unit: 'First words', title: 'Counting 1–10', desc: '하나 둘 셋 넷',
        intro: ['Korean has a second, native set of numbers for counting things, age, and hours.'],
        items: [['num_native', ['하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열']]]
    },
    {
        id: 'w4', unit: 'First words', title: 'Family', desc: '엄마 아빠 언니 형',
        intro: ['What you call an older sibling depends on whether you are male or female.'],
        items: [['family', ['엄마', '아빠', '형', '오빠', '누나', '언니', '할머니', '할아버지']]]
    },
    {
        id: 'w5', unit: 'First words', title: 'Food & drink', desc: '밥 김치 커피',
        intro: ['밥 means cooked rice, and also "a meal".'],
        items: [['food', ['밥', '김치', '커피', '차', '빵', '과일', '라면', '맛있다']], ['vocabulary', ['물']]]
    },
    {
        id: 'w6', unit: 'First words', title: 'Getting around', desc: '집 식당 화장실',
        intro: ['Add 어디예요? to a place to ask where it is: 화장실 어디예요?'],
        items: [['places', ['집', '회사', '식당', '카페', '병원', '역']], ['travel', ['화장실', '어디예요']]]
    },
    {
        id: 'w7', unit: 'First words', title: 'Everyday verbs', desc: '가다 먹다 하다',
        intro: ['Dictionary forms all end in 다. You change the ending to use them in a sentence.'],
        items: [['verbs', ['가다', '오다', '먹다', '마시다', '보다', '하다', '자다', '좋아하다']]]
    },
    {
        id: 'w8', unit: 'First words', title: 'Times of day', desc: '오늘 내일 아침',
        intro: ['아침, 점심 and 저녁 are times of day and also the meals eaten then.'],
        items: [['time', ['오늘', '내일', '어제', '지금', '아침', '점심', '저녁', '밤']]]
    },
    {
        id: 'w9', unit: 'First words', title: 'Useful phrases', desc: '이거 주세요, 얼마예요?',
        intro: ['A handful of phrases that get you through a shop or restaurant.'],
        items: [['phrases', ['이거 주세요', '잠깐만요', '모르겠어요', '잘 먹겠습니다', '천천히 말해 주세요']], ['travel', ['얼마예요']]]
    },
    {
        id: 'w10', unit: 'First words', title: 'Describing things', desc: '좋다 크다 맵다',
        intro: ['Korean adjectives behave like verbs: 크다 means "to be big".'],
        items: [['adjectives', ['좋다', '나쁘다', '크다', '작다', '비싸다', '싸다', '맵다', '재미있다']]]
    },
    {
        id: 'w11', unit: 'First words', title: 'Colors', desc: '빨간색 파란색',
        intro: ['색 means color, so most color words end in 색.'],
        items: [['colors', ['빨간색', '노란색', '초록색', '파란색', '검은색', '하얀색']]]
    }
];
