// LingaloKR guided path: Hangul, first words, sentences, then short conversations.
//
// A lesson runs: intro → concept cards → one card per new item → mixed practice.
//   intro:    short tips shown on the first card
//   concepts: explanation cards. Each has a title and text lines (*stars* = bold), plus any of
//             blocks:   syllables drawn as labelled block diagrams
//             table:    { head: [...], rows: [[...], ...] }
//             dialogue: [[speaker, Korean, English], ...]
//   items:    [topicId, [keys]] pairs pointing into TOPICS (data.js); taught, then practiced
//   build:    syllables to assemble from letter tiles during practice
// Multi-word items also get a "put the words in order" exercise.

const UNITS = [
    { name: 'Read Hangul', desc: 'The alphabet, how letters stack into syllable blocks, and how they sound together.' },
    { name: 'First words', desc: 'Greetings, numbers, family, food, places and everyday verbs.' },
    { name: 'Sentences', desc: 'How Korean sentences work: word order, particles, and verb endings.' },
    { name: 'Conversations', desc: 'Short real-life dialogues that put it all together.' }
];

const LESSONS = [
    /* ---- Read Hangul ---- */
    {
        id: 'h1', unit: 'Read Hangul', title: 'Six simple vowels', desc: 'ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ',
        intro: ['Start with how Hangul is put together, then learn your first six letters.'],
        concepts: [
            {
                title: 'An alphabet in blocks',
                text: ['Hangul is an alphabet: *14* basic consonants and *10* basic vowels, created in 1443 so that anyone could learn to read.',
                    'Letters are not written in a long row like English. They are grouped into square *syllable blocks*, one block per syllable.',
                    'Every block has *at least one consonant and one vowel*. Here is the word 한글 (Hangul) taken apart:'],
                blocks: ['한', '글']
            },
            {
                title: 'Vowels: earth, sky and person',
                text: ['Vowels grow from three ideas: a flat line for the *earth* (ㅡ), a standing *person* (ㅣ), and a short stroke for the *sky*.',
                    'Put the short stroke on one side of ㅣ or ㅡ and you get ㅏ ㅓ ㅗ ㅜ. Follow the direction of the short stroke.']
            }
        ],
        items: [['vowels', ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ']]]
    },
    {
        id: 'h2', unit: 'Read Hangul', title: 'First consonants', desc: 'ㄱ ㄴ ㄷ ㄹ ㅁ',
        intro: ['Each consonant comes with a picture to hang its sound on.'],
        concepts: [
            {
                title: 'Shapes from the mouth',
                text: ['The basic consonants were drawn as pictures of the mouth making each sound.',
                    '*ㄱ* the back of the tongue lifting · *ㄴ* the tongue tip touching behind the teeth · *ㅁ* closed lips.',
                    'Some letters have two sounds: ㄱ is close to *g* at the start of a word and *k* at the end. ㄹ is *r* between vowels and *l* at the end.']
            }
        ],
        items: [['consonants', ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ']]]
    },
    {
        id: 'h3', unit: 'Read Hangul', title: 'More consonants', desc: 'ㅂ ㅅ ㅇ ㅈ ㅎ',
        intro: ['Five more consonants, including the most unusual one: ㅇ.'],
        concepts: [
            {
                title: 'The double life of ㅇ',
                text: ['At the *top* of a block ㅇ is silent. It just fills the consonant spot, because every block needs one.',
                    'At the *bottom* of a block ㅇ sounds like the "ng" in "sing".'],
                blocks: ['아', '강']
            }
        ],
        items: [['consonants', ['ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅎ']]]
    },
    {
        id: 'h4', unit: 'Read Hangul', title: 'Breathy consonants', desc: 'ㅊ ㅋ ㅌ ㅍ',
        intro: ['An extra stroke usually means an extra puff of air.'],
        concepts: [
            {
                title: 'Letter families',
                text: ['Many consonants come in families. Adding a stroke makes a *breathy* version; doubling makes a *tense* one (lesson 7).',
                    'Hold your hand in front of your mouth: ㅋ ㅌ ㅍ ㅊ should push out a puff of air.'],
                table: { head: ['Plain', 'Breathy', 'Tense'], rows: [['ㄱ g', 'ㅋ k', 'ㄲ kk'], ['ㄷ d', 'ㅌ t', 'ㄸ tt'], ['ㅂ b', 'ㅍ p', 'ㅃ pp'], ['ㅈ j', 'ㅊ ch', 'ㅉ jj'], ['ㅅ s', '', 'ㅆ ss']] }
            }
        ],
        items: [['consonants', ['ㅊ', 'ㅋ', 'ㅌ', 'ㅍ']]]
    },
    {
        id: 'h5', unit: 'Read Hangul', title: 'Y vowels', desc: 'ㅑ ㅕ ㅛ ㅠ',
        intro: ['One rule gives you four new vowels.'],
        concepts: [
            {
                title: 'The Y rule',
                text: ['A *second short stroke* adds a "y" sound to the front of a vowel.',
                    'ㅏ → ㅑ (ya) · ㅓ → ㅕ (yeo) · ㅗ → ㅛ (yo) · ㅜ → ㅠ (yu)'],
                blocks: ['야', '요']
            }
        ],
        items: [['vowels', ['ㅑ', 'ㅕ', 'ㅛ', 'ㅠ']]]
    },
    {
        id: 'h6', unit: 'Read Hangul', title: 'Building blocks', desc: '가 나 고 수 아',
        intro: ['Now put letters together. This is the key idea of Hangul.'],
        concepts: [
            {
                title: 'Consonant + vowel, always',
                text: ['Every syllable block needs *both* a consonant and a vowel. ㄱ on its own is a letter, not a syllable. ㄱ + ㅏ makes the syllable 가 (ga).',
                    'The consonant always comes *first*: on the left or on top. Then the vowel.'],
                blocks: ['가', '나', '미']
            },
            {
                title: 'Tall vowels go to the right',
                text: ['ㅏ ㅑ ㅓ ㅕ ㅣ are tall, so they sit to the *right* of the consonant.'],
                blocks: ['너', '리', '샤']
            },
            {
                title: 'Flat vowels go underneath',
                text: ['ㅗ ㅛ ㅜ ㅠ ㅡ are flat, so they sit *under* the consonant.'],
                blocks: ['고', '두', '스']
            },
            {
                title: 'No consonant sound? Use ㅇ',
                text: ['A syllable that starts with a vowel sound still needs something in the consonant spot. Silent ㅇ fills it.',
                    'So 아 is just "a", 우 is "u", and 이 is "i". You will never see a vowel standing alone in a word.'],
                blocks: ['아', '우', '이']
            }
        ],
        items: [['syllables', ['가', '나', '다', '마', '아', '고', '노', '수', '기', '서', '으', '하']]],
        build: ['가', '나', '도', '미', '수', '아', '오', '하']
    },
    {
        id: 'h7', unit: 'Read Hangul', title: 'Double consonants', desc: 'ㄲ ㄸ ㅃ ㅆ ㅉ',
        intro: ['Doubled letters are tense: tighten your throat and say them sharply, with no puff of air.'],
        concepts: [
            {
                title: 'Plain, breathy, tense',
                text: ['Korean tells apart three kinds of g/k, d/t, b/p and j/ch sounds. English only has two, so listen closely.',
                    '가 (plain) · 카 (breathy, a puff of air) · 까 (tense, tight and sharp)'],
                blocks: ['까', '따', '빠', '싸']
            }
        ],
        items: [['doubleConsonants', ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ']]]
    },
    {
        id: 'h8', unit: 'Read Hangul', title: 'Vowels + ㅣ', desc: 'ㅐ ㅔ ㅒ ㅖ',
        intro: ['Adding ㅣ to ㅏ or ㅓ makes an "eh" sound.'],
        concepts: [
            {
                title: 'Two ways to write "eh"',
                text: ['ㅏ + ㅣ = ㅐ and ㅓ + ㅣ = ㅔ. Most people today say them the same way, so you learn which one by spelling.',
                    'Add the Y stroke and you get ㅒ (yae) and ㅖ (ye).'],
                blocks: ['개', '게', '얘', '예']
            }
        ],
        items: [['diphthongs', ['ㅐ', 'ㅔ', 'ㅒ', 'ㅖ']]]
    },
    {
        id: 'h9', unit: 'Read Hangul', title: 'W vowels', desc: 'ㅘ ㅝ ㅚ ㅟ ㅢ',
        intro: ['ㅗ or ㅜ in front of another vowel makes a "w" glide.'],
        concepts: [
            {
                title: 'Vowels that wrap around',
                text: ['These vowels use both spots: the ㅗ or ㅜ part sits *under* the consonant and the second part sits to the *right*.',
                    'Read the parts in order and say them quickly: ㅗ + ㅏ = wa, ㅜ + ㅓ = wo.'],
                blocks: ['과', '워', '쉬']
            }
        ],
        items: [['diphthongs', ['ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ']]]
    },
    {
        id: 'h10', unit: 'Read Hangul', title: 'Your first words', desc: '우유 바다 사과',
        intro: ['You can already read real words.'],
        concepts: [
            {
                title: 'Words are blocks in a row',
                text: ['Read each block, then blend them: 바 + 다 = 바다 (sea).',
                    'Korean puts *spaces between words*, not between blocks, so 바다 is one word made of two blocks.'],
                blocks: ['바', '다']
            }
        ],
        items: [['vocabulary', ['우유', '아이', '오이', '바다', '나라', '모자', '도시', '사과', '고기']]]
    },
    {
        id: 'h11', unit: 'Read Hangul', title: 'Final consonants', desc: '강 밥 물 책',
        intro: ['Some blocks have a third letter at the bottom.'],
        concepts: [
            {
                title: 'A third slot: the final',
                text: ['A consonant at the *bottom* of a block is the final, called 받침 (batchim).',
                    'Reading order never changes: first consonant, then vowel, then the final.'],
                blocks: ['강', '밥', '물', '책']
            },
            {
                title: 'Only seven final sounds',
                text: ['At the end of a syllable consonants are cut short, and many merge into the same sound.',
                    'So 옷 (clothes) is said "ot", even though it is written with ㅅ.'],
                table: { head: ['Written as a final', 'Sounds like'], rows: [['ㄱ ㅋ ㄲ', 'k'], ['ㄴ', 'n'], ['ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ', 't'], ['ㄹ', 'l'], ['ㅁ', 'm'], ['ㅂ ㅍ', 'p'], ['ㅇ', 'ng']] }
            }
        ],
        items: [['vocabulary', ['물', '달', '별', '옷']], ['food', ['밥', '빵']], ['places', ['집', '역']], ['school', ['책']]],
        build: ['강', '밥', '물', '손', '김', '달']
    },
    {
        id: 'h12', unit: 'Read Hangul', title: 'Sounds that change', desc: '한국어 감사합니다',
        intro: ['A few spelling-to-sound rules make Korean flow smoothly.'],
        concepts: [
            {
                title: 'Linking',
                text: ['When a block ends in a final and the next block starts with silent ㅇ, the final *slides over* to fill the gap.',
                    '음악 (music) is said 으막: eumak. 한국어 (Korean) is said 한구거: hangugeo. 일요일 is said 이료일: iryoil.'],
                blocks: ['음', '악']
            },
            {
                title: 'Nasal sounds',
                text: ['A k, t or p sound right before ㄴ or ㅁ turns into ng, n or m.',
                    '감사합니다 is said 감사함니다: gamsahamnida. 십만 (100,000) is said 심만: simman.']
            }
        ],
        items: [['vocabulary', ['한국어', '음악']], ['time', ['일요일', '목요일']], ['food', ['맛있다']], ['travel', ['감사합니다']], ['phrases', ['고맙습니다']], ['num_sino', ['십만']]]
    },

    /* ---- First words ---- */
    {
        id: 'w1', unit: 'First words', title: 'Greetings', desc: '안녕하세요, 감사합니다',
        intro: ['These polite forms work with almost anyone.'],
        concepts: [
            {
                title: 'Being polite',
                text: ['Korean changes its endings depending on who you are talking to.',
                    'Endings in *-요* and *-니다* are polite and safe with strangers, teachers and shop staff. 안녕 on its own (hi) is only for close friends.',
                    'There are two goodbyes: 안녕히 *가세요* (go well) to someone leaving, and 안녕히 *계세요* (stay well) when you are the one leaving.'],
                dialogue: [['A', '안녕하세요.', 'Hello.'], ['B', '안녕하세요.', 'Hello.'], ['A', '감사합니다.', 'Thank you.'], ['B', '아니에요.', 'Not at all.']]
            }
        ],
        items: [['travel', ['안녕하세요', '감사합니다']], ['phrases', ['네', '아니요', '죄송합니다', '괜찮아요', '안녕히 가세요', '안녕히 계세요']]]
    },
    {
        id: 'w2', unit: 'First words', title: 'Numbers 1–10', desc: '일 이 삼 사 오',
        intro: ['Korean has two sets of numbers. Start with the one used for money and dates.'],
        concepts: [
            {
                title: 'Two number systems',
                text: ['*Sino-Korean* numbers come from Chinese. *Native* numbers are originally Korean. Each is used for different things.'],
                table: { head: ['', 'Sino-Korean', 'Native'], rows: [['1', '일', '하나'], ['2', '이', '둘'], ['3', '삼', '셋'], ['Used for', 'money, dates, minutes, phone numbers', 'counting things, age, hours']] }
            }
        ],
        items: [['num_sino', ['일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십']]]
    },
    {
        id: 'w3', unit: 'First words', title: 'Counting 1–10', desc: '하나 둘 셋 넷',
        intro: ['The native numbers, for counting things, people and age.'],
        concepts: [
            {
                title: 'Counting things',
                text: ['After a number Korean adds a *counter* word that says what you are counting.',
                    '하나 둘 셋 넷 get shorter before a counter: 한 개 (one thing), 두 명 (two people), 세 잔 (three cups), 네 살 (four years old).']
            }
        ],
        items: [['num_native', ['하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열']]]
    },
    {
        id: 'w4', unit: 'First words', title: 'Family', desc: '엄마 아빠 언니 형',
        intro: ['What you call an older sibling depends on whether you are male or female.'],
        concepts: [
            {
                title: 'Older brothers and sisters',
                text: ['Korean has no single word for "brother" or "sister". It depends on age and on who is speaking.'],
                table: { head: ['', 'Said by a male', 'Said by a female'], rows: [['Older brother', '형', '오빠'], ['Older sister', '누나', '언니']] }
            }
        ],
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
        intro: ['Dictionary forms all end in 다. In the Sentences unit you will learn to change the ending.'],
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
    },

    /* ---- Sentences ---- */
    {
        id: 'g1', unit: 'Sentences', title: 'I am a student', desc: '이에요 / 예요',
        intro: ['Your first full sentences: saying what something is.'],
        concepts: [
            {
                title: 'The verb goes last',
                text: ['Korean sentences end with the verb. English says "I eat rice"; Korean says *I rice eat*: 저는 밥을 먹어요.',
                    'When it is obvious who you mean, you can drop "I" or "you" completely.']
            },
            {
                title: 'Saying "A is B"',
                text: ['Add *이에요* after a noun ending in a consonant, and *예요* after a noun ending in a vowel.'],
                table: { head: ['Noun', 'Ends in', 'Noun + is'], rows: [['학생', 'consonant ㅇ', '학생이에요'], ['선생님', 'consonant ㅁ', '선생님이에요'], ['사과', 'vowel ㅏ', '사과예요']] }
            }
        ],
        items: [['sent_basics', ['저', '저는', '이거', '이름', '저는 학생이에요', '저는 선생님이에요', '이거 사과예요', '제 이름은 민수예요', '저는 미국 사람이에요']]]
    },
    {
        id: 'g2', unit: 'Sentences', title: 'Topic and subject', desc: '은/는 · 이/가',
        intro: ['Small endings called particles show what each word is doing.'],
        concepts: [
            {
                title: 'Particles mark roles',
                text: ['A particle sticks to the end of a noun to show its job in the sentence.',
                    '*은/는* marks the topic: "as for…". *이/가* marks the subject, often something new or specific.']
            },
            {
                title: 'Pick by the last letter',
                text: ['Like 이에요/예요, the form depends on whether the noun ends in a consonant or a vowel.'],
                table: { head: ['Noun ends in', 'Topic', 'Subject'], rows: [['consonant (책)', '책은', '책이'], ['vowel (친구)', '친구는', '친구가']] }
            }
        ],
        items: [['sent_basics', ['날씨', '여기는 학교예요', '친구가 와요', '날씨가 좋아요', '커피가 맛있어요']], ['school', ['친구']]]
    },
    {
        id: 'g3', unit: 'Sentences', title: 'Have and have not', desc: '있어요 / 없어요',
        intro: ['Two of the most useful words in Korean.'],
        concepts: [
            {
                title: 'There is, I have',
                text: ['*있어요* means both "there is" and "I have". *없어요* is the opposite.',
                    'Raise your voice at the end to ask: 물 있어요? = Is there water? / Do you have water?']
            }
        ],
        items: [['sent_basics', ['있어요', '없어요', '시간 있어요?', '시간이 없어요', '물 있어요?', '동생이 있어요']]]
    },
    {
        id: 'g4', unit: 'Sentences', title: 'Objects', desc: '을/를',
        intro: ['Say what you eat, drink, read and watch.'],
        concepts: [
            {
                title: 'Marking the object',
                text: ['*을/를* marks the object: the thing being eaten, read or watched.',
                    '을 after a consonant (밥을), 를 after a vowel (커피를). The verb still goes last.'],
                table: { head: ['Subject', 'Object', 'Verb'], rows: [['저는', '밥을', '먹어요'], ['I', 'rice', 'eat']] }
            }
        ],
        items: [['sent_basics', ['밥을 먹어요', '커피를 마셔요', '책을 읽어요', '한국어를 공부해요', '영화를 봐요', '저는 커피를 좋아해요']]]
    },
    {
        id: 'g5', unit: 'Sentences', title: 'Polite present tense', desc: '-아요 / -어요',
        intro: ['Turn any dictionary verb into something you can say.'],
        concepts: [
            {
                title: 'Drop 다, add 요',
                text: ['Dictionary forms end in 다. Drop 다 to get the *stem*, then add an ending.',
                    'If the stem\'s last vowel is *ㅏ or ㅗ*, add 아요. Otherwise add 어요. Anything with 하다 becomes 해요.'],
                table: { head: ['Dictionary', 'Stem', 'Polite present'], rows: [['먹다', '먹', '먹어요'], ['좋다', '좋', '좋아요'], ['하다', '하', '해요'], ['공부하다', '공부하', '공부해요']] }
            },
            {
                title: 'Vowels squeeze together',
                text: ['When a stem ends in a vowel, the sounds merge into one block.',
                    '가 + 아요 → *가요* · 오 + 아요 → *와요* · 보 + 아요 → *봐요* · 마시 + 어요 → *마셔요*']
            }
        ],
        items: [['sent_verbs', ['가요', '와요', '먹어요', '마셔요', '봐요', '해요', '자요', '공부해요', '좋아해요']]]
    },
    {
        id: 'g6', unit: 'Sentences', title: "Don't and can't", desc: '안 / 못',
        intro: ['Making a sentence negative takes one word.'],
        concepts: [
            {
                title: 'Put it before the verb',
                text: ['*안* before a verb means "don\'t": 안 가요 = I don\'t go.',
                    '*못* before a verb means "can\'t": 못 가요 = I can\'t go.',
                    'With 하다 verbs it goes right before 해요: 공부 안 해요.']
            }
        ],
        items: [['sent_verbs', ['안 가요', '안 먹어요', '못 가요', '못 먹어요', '공부 안 해요']]]
    },
    {
        id: 'g7', unit: 'Sentences', title: 'Asking questions', desc: '뭐 어디 누구 언제',
        intro: ['Questions are easy: no word order changes needed.'],
        concepts: [
            {
                title: 'Just raise your voice',
                text: ['A statement becomes a question by raising your voice at the end: 가요. → 가요?',
                    'Question words usually go right before the verb or 이에요/예요: 이거 *뭐*예요? = What is this?']
            }
        ],
        items: [['sent_questions', ['뭐', '어디', '누구', '언제', '왜', '몇', '이름이 뭐예요?', '이거 뭐예요?', '화장실이 어디예요?', '몇 살이에요?']]]
    },
    {
        id: 'g8', unit: 'Sentences', title: 'Places', desc: '에 / 에서',
        intro: ['Say where you are going and where things happen.'],
        concepts: [
            {
                title: 'Going to vs. doing at',
                text: ['*에* marks where you go, or where something is: 학교*에* 가요, 집*에* 있어요.',
                    '*에서* marks where an action happens: 카페*에서* 공부해요.']
            }
        ],
        items: [['sent_basics', ['학교에 가요', '집에 있어요', '카페에서 공부해요', '식당에서 밥을 먹어요', '회사에서 일해요']]]
    },
    {
        id: 'g9', unit: 'Sentences', title: 'Past tense', desc: '-았어요 / -었어요',
        intro: ['Talk about what you did.'],
        concepts: [
            {
                title: 'Add ㅆ어요',
                text: ['Take the present form, drop 요, and add *ㅆ어요*: 가요 → 갔어요, 먹어요 → 먹었어요, 해요 → 했어요.',
                    'Put a time word like 어제 (yesterday) at the front.'],
                table: { head: ['Present', 'Past'], rows: [['가요', '갔어요'], ['먹어요', '먹었어요'], ['봐요', '봤어요'], ['해요', '했어요']] }
            }
        ],
        items: [['sent_verbs', ['갔어요', '먹었어요', '봤어요', '했어요', '마셨어요', '어제 영화를 봤어요', '아침을 먹었어요']]]
    },
    {
        id: 'g10', unit: 'Sentences', title: 'I want to…', desc: '-고 싶어요',
        intro: ['Say what you want to do.'],
        concepts: [
            {
                title: 'Stem + 고 싶어요',
                text: ['Drop 다 from the verb and add *고 싶어요*: 가다 → 가고 싶어요 (I want to go).',
                    'Objects and places go in front as usual: 한국에 가고 싶어요.']
            }
        ],
        items: [['sent_verbs', ['가고 싶어요', '먹고 싶어요', '자고 싶어요', '한국에 가고 싶어요', '커피를 마시고 싶어요']]]
    },
    {
        id: 'g11', unit: 'Sentences', title: 'Asking politely', desc: '주세요 / -세요',
        intro: ['Ask for things and ask people to do things.'],
        concepts: [
            {
                title: 'Three ways to say please',
                text: ['Noun + *주세요* asks for a thing: 물 주세요 (water, please).',
                    'Verb + *아/어 주세요* asks someone to do something for you: 기다려 주세요 (please wait).',
                    'Stem + *(으)세요* is a polite instruction: 앉으세요 (please sit).']
            }
        ],
        items: [['sent_questions', ['물 주세요', '메뉴 주세요', '잠깐만 기다려 주세요', '여기 앉으세요', '도와주세요', '계산해 주세요']]]
    },

    /* ---- Conversations ---- */
    {
        id: 'c1', unit: 'Conversations', title: 'Meeting someone', desc: '만나서 반가워요',
        intro: ['Read the conversation, tap a line to hear it, then learn the key lines.'],
        concepts: [
            {
                title: 'First meeting',
                dialogue: [['민수', '안녕하세요. 저는 민수예요.', "Hi, I'm Minsu."], ['지나', '안녕하세요. 저는 지나예요.', "Hi, I'm Jina."], ['민수', '만나서 반가워요.', 'Nice to meet you.'],
                    ['지나', '어느 나라 사람이에요?', 'Where are you from?'], ['민수', '캐나다 사람이에요.', "I'm Canadian."], ['지나', '한국어 잘하시네요!', 'Your Korean is good!'], ['민수', '아직 잘 못해요.', "I'm not good at it yet."]]
            }
        ],
        items: [['sent_talk', ['만나서 반가워요', '저는 지나예요', '어느 나라 사람이에요?', '캐나다 사람이에요', '한국어 잘하시네요', '아직 잘 못해요']]]
    },
    {
        id: 'c2', unit: 'Conversations', title: 'At a café', desc: '아메리카노 한 잔 주세요',
        intro: ['Order a drink from start to finish.'],
        concepts: [
            {
                title: 'Ordering coffee',
                dialogue: [['Staff', '어서 오세요. 뭐 드릴까요?', 'Welcome. What can I get you?'], ['You', '아메리카노 한 잔 주세요.', 'One americano, please.'], ['Staff', '여기서 드세요?', 'For here?'],
                    ['You', '아니요, 가져갈게요.', "No, I'll take it to go."], ['You', '카드 돼요?', 'Can I pay by card?'], ['Staff', '네, 사천오백 원이에요.', "Yes, that's 4,500 won."]]
            }
        ],
        items: [['sent_talk', ['뭐 드릴까요?', '아메리카노 한 잔 주세요', '여기서 드세요?', '가져갈게요', '카드 돼요?']]]
    },
    {
        id: 'c3', unit: 'Conversations', title: 'Asking the way', desc: '지하철역이 어디예요?',
        intro: ['Find your way around town.'],
        concepts: [
            {
                title: 'Directions',
                dialogue: [['You', '저기요, 지하철역이 어디예요?', 'Excuse me, where is the subway station?'], ['Local', '쭉 가세요. 그리고 오른쪽으로 가세요.', 'Go straight, then go right.'],
                    ['You', '멀어요?', 'Is it far?'], ['Local', '아니요, 왼쪽에 있어요. 가까워요.', "No, it's on the left. It's close."], ['You', '감사합니다!', 'Thank you!']]
            }
        ],
        items: [['sent_talk', ['저기요', '지하철역이 어디예요?', '쭉 가세요', '오른쪽으로 가세요', '왼쪽에 있어요', '멀어요?']]]
    },
    {
        id: 'c4', unit: 'Conversations', title: 'Making plans', desc: '같이 영화 볼까요?',
        intro: ['Invite a friend out.'],
        concepts: [
            {
                title: 'Weekend plans',
                dialogue: [['A', '주말에 뭐 해요?', 'What are you doing this weekend?'], ['B', '친구를 만나요. 왜요?', "I'm meeting a friend. Why?"], ['A', '같이 영화 볼까요?', 'Shall we see a movie together?'],
                    ['B', '좋아요! 몇 시에 만날까요?', 'Sounds good! What time shall we meet?'], ['A', '세 시에 만나요.', "Let's meet at three."]]
            }
        ],
        items: [['sent_talk', ['주말에 뭐 해요?', '친구를 만나요', '같이 영화 볼까요?', '좋아요', '몇 시에 만날까요?', '세 시에 만나요']]]
    }
];
