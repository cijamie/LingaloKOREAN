// LingaloKR curriculum data.
// Word entries are  word: [romanization, meaning].
// Alphabet topics (chars: true) are  letter: sound.
// Topics with idPrefix keep words that share a spelling apart, e.g. 일 "1" vs 일 "work".

const KOREAN = {
    id: 'korean',
    name: 'Korean',
    nativeName: '한국어',
    accent: '#d97706',
    font: "'Noto Sans KR', sans-serif",
    speechLang: 'ko-KR',
    subtitle: 'Hangul, numbers, and everyday Korean',
    basicWords: {
        'hello': '안녕하세요', 'hi': '안녕', 'water': '물', 'apple': '사과', 'love': '사랑',
        'school': '학교', 'friend': '친구', 'cat': '고양이', 'dog': '강아지', 'thank you': '감사합니다'
    }
};

const TOPICS = [
    /* ---- Hangul ---- */
    {
        id: 'consonants', group: 'Hangul', label: 'Basic consonants', chars: true,
        words: { 'ㄱ': 'g', 'ㄴ': 'n', 'ㄷ': 'd', 'ㄹ': 'r/l', 'ㅁ': 'm', 'ㅂ': 'b', 'ㅅ': 's', 'ㅇ': 'ng', 'ㅈ': 'j', 'ㅊ': 'ch', 'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'h' }
    },
    {
        id: 'vowels', group: 'Hangul', label: 'Basic vowels', chars: true,
        words: { 'ㅏ': 'a', 'ㅑ': 'ya', 'ㅓ': 'eo', 'ㅕ': 'yeo', 'ㅗ': 'o', 'ㅛ': 'yo', 'ㅜ': 'u', 'ㅠ': 'yu', 'ㅡ': 'eu', 'ㅣ': 'i' }
    },
    {
        id: 'doubleConsonants', group: 'Hangul', label: 'Double consonants', chars: true,
        words: { 'ㄲ': 'kk', 'ㄸ': 'tt', 'ㅃ': 'pp', 'ㅆ': 'ss', 'ㅉ': 'jj' }
    },
    {
        id: 'diphthongs', group: 'Hangul', label: 'Combined vowels', chars: true,
        words: { 'ㅐ': 'ae', 'ㅒ': 'yae', 'ㅔ': 'e', 'ㅖ': 'ye', 'ㅘ': 'wa', 'ㅙ': 'wae', 'ㅚ': 'oe', 'ㅝ': 'wo', 'ㅞ': 'we', 'ㅟ': 'wi', 'ㅢ': 'ui' }
    },
    {
        id: 'syllables', group: 'Hangul', label: 'Syllable blocks', sub: 'Consonant + vowel', chars: true,
        words: {
            '가': 'ga', '나': 'na', '다': 'da', '라': 'ra', '마': 'ma', '바': 'ba', '사': 'sa', '아': 'a', '자': 'ja', '하': 'ha',
            '고': 'go', '노': 'no', '도': 'do', '모': 'mo', '소': 'so', '구': 'gu', '누': 'nu', '부': 'bu', '수': 'su', '우': 'u',
            '기': 'gi', '미': 'mi', '시': 'si', '머': 'meo', '서': 'seo', '어': 'eo', '으': 'eu', '크': 'keu', '토': 'to', '피': 'pi'
        }
    },

    /* ---- Numbers ---- */
    {
        id: 'num_sino', group: 'Numbers', label: 'Sino-Korean numbers', sub: 'Money, minutes, dates, floors', idPrefix: 'num',
        words: {
            '영': ['yeong', '0'], '일': ['il', '1'], '이': ['i', '2'], '삼': ['sam', '3'], '사': ['sa', '4'],
            '오': ['o', '5'], '육': ['yuk', '6'], '칠': ['chil', '7'], '팔': ['pal', '8'], '구': ['gu', '9'],
            '십': ['sip', '10'], '이십': ['isip', '20'], '삼십': ['samsip', '30'], '오십': ['osip', '50'],
            '백': ['baek', '100'], '천': ['cheon', '1,000'], '만': ['man', '10,000'], '십만': ['simman', '100,000'],
            '백만': ['baengman', '1,000,000'], '억': ['eok', '100,000,000']
        }
    },
    {
        id: 'num_native', group: 'Numbers', label: 'Native Korean numbers', sub: 'Counting, age, hours', idPrefix: 'nat',
        words: {
            '하나': ['hana', '1'], '둘': ['dul', '2'], '셋': ['set', '3'], '넷': ['net', '4'], '다섯': ['daseot', '5'],
            '여섯': ['yeoseot', '6'], '일곱': ['ilgop', '7'], '여덟': ['yeodeol', '8'], '아홉': ['ahop', '9'], '열': ['yeol', '10'],
            '스물': ['seumul', '20'], '서른': ['seoreun', '30'], '마흔': ['maheun', '40'], '쉰': ['swin', '50'],
            '예순': ['yesun', '60'], '일흔': ['ilheun', '70'], '여든': ['yeodeun', '80'], '아흔': ['aheun', '90']
        }
    },
    {
        id: 'num_counters', group: 'Numbers', label: 'Counters', sub: 'Words that follow a number', idPrefix: 'ctr',
        words: {
            '한': ['han', 'one (before a counter)'], '두': ['du', 'two (before a counter)'], '세': ['se', 'three (before a counter)'],
            '네': ['ne', 'four (before a counter)'], '스무': ['seumu', 'twenty (before a counter)'],
            '개': ['gae', 'things (native numbers)'], '명': ['myeong', 'people (native numbers)'], '살': ['sal', 'years of age (native numbers)'],
            '시': ['si', "o'clock (native numbers)"], '마리': ['mari', 'animals (native numbers)'], '잔': ['jan', 'cups, glasses (native numbers)'],
            '권': ['gwon', 'books (native numbers)'], '병': ['byeong', 'bottles (native numbers)'], '장': ['jang', 'sheets, tickets (native numbers)'],
            '번': ['beon', 'times (native) / number (Sino)'], '분': ['bun', 'minutes (Sino numbers)'], '원': ['won', 'won, money (Sino numbers)'],
            '층': ['cheung', 'floor (Sino numbers)'], '년': ['nyeon', 'year (Sino numbers)'], '월': ['wol', 'month (Sino numbers)'],
            '일': ['il', 'day of the month (Sino numbers)']
        }
    },
    {
        id: 'num_months', group: 'Numbers', label: 'Months', sub: '유월 and 시월 drop a sound', idPrefix: 'mon',
        words: {
            '일월': ['irwol', 'January'], '이월': ['iwol', 'February'], '삼월': ['samwol', 'March'], '사월': ['sawol', 'April'],
            '오월': ['owol', 'May'], '유월': ['yuwol', 'June'], '칠월': ['chirwol', 'July'], '팔월': ['parwol', 'August'],
            '구월': ['guwol', 'September'], '시월': ['siwol', 'October'], '십일월': ['sibirwol', 'November'], '십이월': ['sibiwol', 'December']
        }
    },

    /* ---- Vocabulary ---- */
    {
        id: 'phrases', group: 'Vocabulary', label: 'Everyday phrases', sub: 'Polite set expressions',
        words: {
            '네': ['ne', 'Yes'], '아니요': ['aniyo', 'No'], '괜찮아요': ['gwaenchanayo', "It's okay / I'm fine"],
            '죄송합니다': ['joesonghamnida', "I'm sorry (formal)"], '고맙습니다': ['gomapseumnida', 'Thank you'],
            '안녕히 가세요': ['annyeonghi gaseyo', 'Goodbye (to someone leaving)'], '안녕히 계세요': ['annyeonghi gyeseyo', "Goodbye (when you're leaving)"],
            '처음 뵙겠습니다': ['cheoeum boepgetseumnida', 'Nice to meet you'], '잘 먹겠습니다': ['jal meokgetseumnida', "I'll enjoy the meal"],
            '잘 먹었습니다': ['jal meogeotseumnida', 'I enjoyed the meal'], '이거 주세요': ['igeo juseyo', 'This one, please'],
            '잠깐만요': ['jamkkanmanyo', 'Just a moment'], '모르겠어요': ['moreugesseoyo', "I don't know"],
            '천천히 말해 주세요': ['cheoncheonhi malhae juseyo', 'Please speak slowly'], '다시 한 번 말해 주세요': ['dasi han beon malhae juseyo', 'Please say that again'],
            '화이팅': ['hwaiting', 'You can do it!']
        }
    },
    {
        id: 'vocabulary', group: 'Vocabulary', label: 'Core vocabulary', sub: 'Everyday nouns',
        words: {
            '사과': ['sagwa', 'Apple'], '우유': ['uyu', 'Milk'], '고기': ['gogi', 'Meat'], '나라': ['nara', 'Country'],
            '도시': ['dosi', 'City'], '아이': ['ai', 'Child'], '오이': ['oi', 'Cucumber'], '모자': ['moja', 'Hat'],
            '학교': ['hakgyo', 'School'], '바다': ['bada', 'Sea'], '하늘': ['haneul', 'Sky'], '물': ['mul', 'Water'],
            '사랑': ['sarang', 'Love'], '달': ['dal', 'Moon'], '별': ['byeol', 'Star']
        }
    },
    {
        id: 'food', group: 'Vocabulary', label: 'Food & drink', sub: 'Eating out and at home',
        words: {
            '밥': ['bap', 'Rice / meal'], '김치': ['gimchi', 'Kimchi'], '커피': ['keopi', 'Coffee'], '차': ['cha', 'Tea'],
            '주스': ['juseu', 'Juice'], '맥주': ['maekju', 'Beer'], '빵': ['ppang', 'Bread'], '생선': ['saengseon', 'Fish (food)'],
            '계란': ['gyeran', 'Egg'], '과일': ['gwail', 'Fruit'], '야채': ['yachae', 'Vegetables'], '라면': ['ramyeon', 'Ramen'],
            '비빔밥': ['bibimbap', 'Bibimbap'], '불고기': ['bulgogi', 'Bulgogi'], '떡볶이': ['tteokbokki', 'Tteokbokki (spicy rice cakes)'],
            '메뉴': ['menyu', 'Menu'], '숟가락': ['sutgarak', 'Spoon'], '젓가락': ['jeotgarak', 'Chopsticks'],
            '맛있다': ['masitda', 'To be delicious'], '배고프다': ['baegopeuda', 'To be hungry']
        }
    },
    {
        id: 'family', group: 'Vocabulary', label: 'Family', sub: 'Family members',
        words: {
            '가족': ['gajok', 'Family'], '아버지': ['abeoji', 'Father'], '어머니': ['eomeoni', 'Mother'], '아빠': ['appa', 'Dad'],
            '엄마': ['eomma', 'Mom'], '형': ['hyeong', 'Older brother (said by a male)'], '오빠': ['oppa', 'Older brother (said by a female)'],
            '누나': ['nuna', 'Older sister (said by a male)'], '언니': ['eonni', 'Older sister (said by a female)'],
            '남동생': ['namdongsaeng', 'Younger brother'], '여동생': ['yeodongsaeng', 'Younger sister'],
            '할아버지': ['harabeoji', 'Grandfather'], '할머니': ['halmeoni', 'Grandmother'], '남편': ['nampyeon', 'Husband'],
            '아내': ['anae', 'Wife'], '아들': ['adeul', 'Son'], '딸': ['ttal', 'Daughter'], '아기': ['agi', 'Baby']
        }
    },
    {
        id: 'body', group: 'Vocabulary', label: 'Body', sub: 'Parts of the body', idPrefix: 'body',
        words: {
            '머리': ['meori', 'Head / hair'], '얼굴': ['eolgul', 'Face'], '눈': ['nun', 'Eye'], '코': ['ko', 'Nose'],
            '입': ['ip', 'Mouth'], '귀': ['gwi', 'Ear'], '목': ['mok', 'Neck / throat'], '어깨': ['eokkae', 'Shoulder'],
            '팔': ['pal', 'Arm'], '손': ['son', 'Hand'], '배': ['bae', 'Stomach'], '허리': ['heori', 'Lower back'],
            '다리': ['dari', 'Leg'], '발': ['bal', 'Foot']
        }
    },
    {
        id: 'time', group: 'Vocabulary', label: 'Time & days', sub: 'Days of the week and times of day',
        words: {
            '오늘': ['oneul', 'Today'], '내일': ['naeil', 'Tomorrow'], '어제': ['eoje', 'Yesterday'], '지금': ['jigeum', 'Now'],
            '아침': ['achim', 'Morning / breakfast'], '점심': ['jeomsim', 'Lunch / midday'], '저녁': ['jeonyeok', 'Evening / dinner'],
            '밤': ['bam', 'Night'], '주말': ['jumal', 'Weekend'], '시간': ['sigan', 'Time / hour'],
            '월요일': ['woryoil', 'Monday'], '화요일': ['hwayoil', 'Tuesday'], '수요일': ['suyoil', 'Wednesday'],
            '목요일': ['mogyoil', 'Thursday'], '금요일': ['geumyoil', 'Friday'], '토요일': ['toyoil', 'Saturday'], '일요일': ['iryoil', 'Sunday']
        }
    },
    {
        id: 'colors', group: 'Vocabulary', label: 'Colors', sub: 'Basic colors',
        words: {
            '색깔': ['saekkkal', 'Color'], '빨간색': ['ppalgansaek', 'Red'], '주황색': ['juhwangsaek', 'Orange'], '노란색': ['noransaek', 'Yellow'],
            '초록색': ['choroksaek', 'Green'], '파란색': ['paransaek', 'Blue'], '보라색': ['borasaek', 'Purple'], '분홍색': ['bunhongsaek', 'Pink'],
            '갈색': ['galsaek', 'Brown'], '회색': ['hoesaek', 'Gray'], '검은색': ['geomeunsaek', 'Black'], '하얀색': ['hayansaek', 'White']
        }
    },
    {
        id: 'verbs', group: 'Vocabulary', label: 'Common verbs', sub: 'Dictionary forms',
        words: {
            '가다': ['gada', 'To go'], '오다': ['oda', 'To come'], '먹다': ['meokda', 'To eat'], '마시다': ['masida', 'To drink'],
            '보다': ['boda', 'To see / watch'], '하다': ['hada', 'To do'], '자다': ['jada', 'To sleep'], '읽다': ['ikda', 'To read'],
            '쓰다': ['sseuda', 'To write / use'], '듣다': ['deutda', 'To listen'], '말하다': ['malhada', 'To speak'], '사다': ['sada', 'To buy'],
            '만나다': ['mannada', 'To meet'], '공부하다': ['gongbuhada', 'To study'], '일하다': ['ilhada', 'To work'],
            '좋아하다': ['joahada', 'To like'], '알다': ['alda', 'To know'], '배우다': ['baeuda', 'To learn'],
            '기다리다': ['gidarida', 'To wait'], '주다': ['juda', 'To give']
        }
    },
    {
        id: 'adjectives', group: 'Vocabulary', label: 'Common adjectives', sub: 'Describing words',
        words: {
            '좋다': ['jota', 'To be good'], '나쁘다': ['nappeuda', 'To be bad'], '크다': ['keuda', 'To be big'], '작다': ['jakda', 'To be small'],
            '많다': ['manta', 'To be many / a lot'], '적다': ['jeokda', 'To be few'], '비싸다': ['bissada', 'To be expensive'],
            '싸다': ['ssada', 'To be cheap'], '덥다': ['deopda', 'To be hot (weather)'], '춥다': ['chupda', 'To be cold (weather)'],
            '맵다': ['maepda', 'To be spicy'], '재미있다': ['jaemiitda', 'To be fun'], '어렵다': ['eoryeopda', 'To be difficult'],
            '쉽다': ['swipda', 'To be easy'], '바쁘다': ['bappeuda', 'To be busy'], '예쁘다': ['yeppeuda', 'To be pretty'],
            '멀다': ['meolda', 'To be far'], '가깝다': ['gakkapda', 'To be close']
        }
    },
    {
        id: 'places', group: 'Vocabulary', label: 'Places', sub: 'Around town',
        words: {
            '집': ['jip', 'Home / house'], '회사': ['hoesa', 'Company / office'], '병원': ['byeongwon', 'Hospital'],
            '약국': ['yakguk', 'Pharmacy'], '은행': ['eunhaeng', 'Bank'], '식당': ['sikdang', 'Restaurant'], '카페': ['kape', 'Cafe'],
            '시장': ['sijang', 'Market'], '편의점': ['pyeonuijeom', 'Convenience store'], '도서관': ['doseogwan', 'Library'],
            '공원': ['gongwon', 'Park'], '역': ['yeok', 'Station'], '공항': ['gonghang', 'Airport'],
            '백화점': ['baekhwajeom', 'Department store'], '우체국': ['ucheguk', 'Post office']
        }
    },
    {
        id: 'travel', group: 'Vocabulary', label: 'Travel', sub: 'Getting around',
        words: {
            '안녕하세요': ['annyeonghaseyo', 'Hello'], '감사합니다': ['gamsahamnida', 'Thank you'], '화장실': ['hwajangsil', 'Restroom'],
            '여권': ['yeogwon', 'Passport'], '비행기': ['bihaenggi', 'Airplane'], '택시': ['taeksi', 'Taxi'], '한국': ['hanguk', 'Korea'],
            '어디예요': ['eodiyeyo', 'Where is it?'], '얼마예요': ['eolmayeyo', 'How much is it?']
        }
    },
    {
        id: 'school', group: 'Vocabulary', label: 'School', sub: 'Classroom words',
        words: {
            '선생님': ['seonsaengnim', 'Teacher'], '학생': ['haksaeng', 'Student'], '교실': ['gyosil', 'Classroom'], '책': ['chaek', 'Book'],
            '대학교': ['daehakgyo', 'University'], '친구': ['chingu', 'Friend'], '연필': ['yeonpil', 'Pencil']
        }
    }
];

// Picture hooks for each letter: letter: [sound, mnemonic]. *Stars* mark the letters to stress.
const MNEMONICS = {
    /* Basic consonants */
    'ㄱ': ['g / k', '*G*un'],
    'ㄴ': ['n', '*N*ose (the side profile of a nose)'],
    'ㄷ': ['d / t', '*D*oor (a partly opened door)'],
    'ㄹ': ['r / l', '*R*attlesnake (a slithering snake shape)'],
    'ㅁ': ['m', '*M*outh (open in a wide square)'],
    'ㅂ': ['b / p', '*B*ed (with a headboard and footboard)'],
    'ㅅ': ['s', '*S*ummit of a mountain, or a *S*lide'],
    'ㅇ': ['ng / silent', 'Ri*ng* at the bottom of a block; a silent zero at the top'],
    'ㅈ': ['j', '*J*ug (with a spout pointing out)'],
    'ㅊ': ['ch', '*Ch*urch (the jug with a steeple on top)'],
    'ㅋ': ['k', '*K*ey (sticking into a lock)'],
    'ㅌ': ['t', '*T*eeth (a set of front teeth)'],
    'ㅍ': ['p', '*P*illars (two columns holding up a roof)'],
    'ㅎ': ['h', '*H*at (a top hat sitting on a head)'],

    /* Double consonants: two of the same letter, said tense and sharp with no puff of air */
    'ㄲ': ['kk', 'Two *G*uns: a tense, sharper g'],
    'ㄸ': ['tt', 'Two *D*oors: a tense, sharper d'],
    'ㅃ': ['pp', 'Two *B*eds: a tense, sharper b'],
    'ㅆ': ['ss', 'Two *S*lides: a hissing, tense s'],
    'ㅉ': ['jj', 'Two *J*ugs: a tense, sharper j'],

    /* Basic vowels: follow the short stroke */
    'ㅏ': ['a (ah)', 'Arm pointing *A*way (to the right)'],
    'ㅓ': ['eo (uh)', 'Arm pointing *I*n (to the left, toward the body)'],
    'ㅗ': ['o (oh)', 'Pointing *O*ver (up)'],
    'ㅜ': ['u (ooh)', 'Pointing *U*nder (down)'],
    'ㅡ': ['eu (uh)', 'Flat like the *E*arth'],
    'ㅣ': ['i (ee)', 'Standing tall like a tr*ee*'],
    'ㅑ': ['ya', 'Two strokes add a *Y*: ㅏ (a) → ㅑ (ya)'],
    'ㅕ': ['yeo', 'Two strokes add a *Y*: ㅓ (eo) → ㅕ (yeo)'],
    'ㅛ': ['yo', 'Two strokes add a *Y*: ㅗ (o) → ㅛ (yo)'],
    'ㅠ': ['yu', 'Two strokes add a *Y*: ㅜ (u) → ㅠ (yu)'],

    /* Combined vowels: the parts, said quickly together */
    'ㅐ': ['ae (eh)', 'ㅏ + ㅣ squeezed together'],
    'ㅔ': ['e (eh)', 'ㅓ + ㅣ; sounds almost the same as ㅐ'],
    'ㅒ': ['yae', 'ㅐ with the *Y* stroke'],
    'ㅖ': ['ye', 'ㅔ with the *Y* stroke'],
    'ㅘ': ['wa', 'ㅗ + ㅏ: o + a, said fast'],
    'ㅙ': ['wae', 'ㅗ + ㅐ: o + ae, said fast'],
    'ㅚ': ['oe (we)', 'ㅗ + ㅣ; today said like "we"'],
    'ㅝ': ['wo', 'ㅜ + ㅓ: u + eo, said fast'],
    'ㅞ': ['we', 'ㅜ + ㅔ: u + e, said fast'],
    'ㅟ': ['wi', 'ㅜ + ㅣ: u + i, said fast'],
    'ㅢ': ['ui', 'ㅡ + ㅣ: eu + i, said fast']
};
