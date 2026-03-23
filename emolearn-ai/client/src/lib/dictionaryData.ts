export interface DictionaryWord {
  id: string;
  wordKz: string;
  transliteration: string;
  category: string;
  difficulty: 'ОҢАЙ' | 'ОРТАША' | 'ҚИЫН';
  color: string;
  description: string;
  gesture: string;
  emoji: string;
  animation?: 'wave' | 'bounce' | 'pulse' | 'shake';
  gifUrl?: string;
}

export const DICTIONARY_CATEGORIES = [
  { id: 'all', label: 'Барлығы', iconName: 'Grid3X3' },
  { id: 'basic', label: 'Негізгі', iconName: 'Home' },
  { id: 'family', label: 'Отбасы', iconName: 'Users' },
  { id: 'school', label: 'Мектеп', iconName: 'GraduationCap' },
  { id: 'numbers', label: 'Сандар', iconName: 'Hash' },
  { id: 'colors', label: 'Түстер', iconName: 'Palette' },
  { id: 'emotions', label: 'Сезімдер', iconName: 'Heart' },
  { id: 'food', label: 'Тағам', iconName: 'Apple' },
  { id: 'bookmarks', label: 'Сақталған', iconName: 'Bookmark' },
]

// All GIFs sourced from "Sign with Robert" educational ASL series on GIPHY
// https://giphy.com/signwithrobert
const G = (id: string) => `https://media.giphy.com/media/${id}/giphy.gif`

export const DICTIONARY_DATA: DictionaryWord[] = [
  // ═══════════════ НЕГІЗГІ (15) ═══════════════
  { id: 'w1',  wordKz: 'Сәлем',     transliteration: 'Salem',        category: 'basic', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Күнделікті амандасу. Қолды бос ұстап, алақанды қаратып бұлғау.',                    gesture: 'Ашық алақан',          emoji: '👋', animation: 'wave',   gifUrl: G('3o7TKNKOfKlIhbD3gY') },
  { id: 'w2',  wordKz: 'Жақсы',     transliteration: 'Zhaqsy',       category: 'basic', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Келісім, мақұлдау. Бас бармақты жоғары қарату.',                                    gesture: 'Бас бармақ жоғары',    emoji: '👍', animation: 'bounce' },
  { id: 'w3',  wordKz: 'Рахмет',    transliteration: 'Rakhmet',      category: 'basic', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Алғыс білдіру. Иекке тигізілген алақанды алға қарай жіберу.',                      gesture: 'Алақан (иектен алға)', emoji: '🙌', animation: 'pulse',  gifUrl: G('l0MYrlUnFtq25TQR2') },
  { id: 'w4',  wordKz: 'Мен',       transliteration: 'Men',          category: 'basic', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Өзін көрсету. Сұқ саусақпен кеудеге нұсқау.',                                     gesture: 'Сұқ саусақ',           emoji: '☝️', animation: 'bounce' },
  { id: 'w5',  wordKz: 'Сіз',       transliteration: 'Siz',          category: 'basic', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Сұхбаттасушыға құрметпен жүгіну. Саусақпен оған қарату.',                        gesture: 'V белгісі',            emoji: '👉', animation: 'pulse' },
  { id: 'w6',  wordKz: 'Сүйемін',   transliteration: 'Suıemin',      category: 'basic', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Махаббат білдіру. Бас бармақ, сұқ саусақ, кішкене саусақ жоғары.',               gesture: 'ILY белгісі',          emoji: '🤟', animation: 'pulse',  gifUrl: G('l0MYIzZOf4MXjw34I') },
  { id: 'w7',  wordKz: 'Стоп',      transliteration: 'Stop',         category: 'basic', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Тоқтату мағынасы. Алақанды алға қарату.',                                         gesture: 'Жұдырық',              emoji: '✋', animation: 'shake',  gifUrl: G('3oz8xvTLySRClnMMko') },
  { id: 'w8',  wordKz: 'Телефон',   transliteration: 'Telefon',      category: 'basic', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Қоңырау шалу. Шака белгісімен құлаққа жақындату.',                                gesture: 'Шака белгісі',         emoji: '🤙', animation: 'shake',  gifUrl: G('3oz8xZND6psYCeuBC8') },
  { id: 'w9',  wordKz: 'Иә',        transliteration: 'Iä',           category: 'basic', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Келісу, растау. Жұдырықпен бас изеу қимылын жасау.',                               gesture: 'Жұдырық (бас изеу)',    emoji: '✅', animation: 'bounce', gifUrl: G('l4Jz0THKhQLo61NBK') },
  { id: 'w10', wordKz: 'Жоқ',       transliteration: 'Zhoq',         category: 'basic', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Бас тарту. Сұқ саусақты оңға-солға бұлғау.',                                     gesture: 'Сұқ саусақ (бұлғау)',   emoji: '❌', animation: 'shake',  gifUrl: G('l4Jz4faxuS1FiSEV2') },
  { id: 'w11', wordKz: 'Кешіріңіз', transliteration: 'Keshiriñiz',   category: 'basic', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Кешірім сұрау. Жұдырықпен кеудені айналдыру.',                                   gesture: 'Жұдырық (кеуде)',      emoji: '🙏', animation: 'pulse',  gifUrl: G('3o7TKv1AUWn7J5DlF6') },
  { id: 'w12', wordKz: 'Көмек',     transliteration: 'Kömek',        category: 'basic', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Көмек сұрау. Жұдырықты ашық алақанға қою.',                                      gesture: 'Жұдырық + алақан',     emoji: '🆘', animation: 'bounce', gifUrl: G('3oz8xxZjw8HJxLcmD6') },
  { id: 'w13', wordKz: 'Достық',    transliteration: 'Dostyq',       category: 'basic', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Достық. Екі сұқ саусақты байланыстыру.',                                          gesture: 'Екі саусақ',           emoji: '🤝', animation: 'pulse',  gifUrl: G('3o7TKxJ9b7iHDWj0pa') },
  { id: 'w14', wordKz: 'Уақыт',     transliteration: 'Uaqyt',        category: 'basic', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Сағатты көрсету. Білекке сұқ саусақпен нұсқау.',                                  gesture: 'Сұқ саусақ (білек)',    emoji: '⏰', animation: 'pulse',  gifUrl: G('3o6ZsYLpcYUwRtgRTG') },
  { id: 'w15', wordKz: 'Жүр',       transliteration: 'Zhür',         category: 'basic', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Шақыру, жүру. Қолмен өзіңе қарай ишарат жасау.',                                 gesture: 'Қол (шақыру)',         emoji: '🚶', animation: 'wave' },

  // ═══════════════ ОТБАСЫ (8) ═══════════════
  { id: 'w16', wordKz: 'Ана',       transliteration: 'Ana',          category: 'family', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Ана. Бас бармақты иекке тигізіп, саусақтарды ашық ұстау.',                       gesture: 'Ашық алақан (иекке)',   emoji: '👩', animation: 'bounce', gifUrl: G('3o7TKOMlsNLawB8B9K') },
  { id: 'w17', wordKz: 'Әке',       transliteration: 'Äke',          category: 'family', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Әке. Бас бармақты маңдайға тигізіп, саусақтарды ашық ұстау.',                    gesture: 'Ашық алақан (маңдай)', emoji: '👨', animation: 'bounce', gifUrl: G('l0HlNzPBWFE3c2Hao') },
  { id: 'w18', wordKz: 'Бала',      transliteration: 'Bala',         category: 'family', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Бала, нәресте. Қолды төмен қарай бұлғау.',                                       gesture: 'Қол (төмен)',          emoji: '👶', animation: 'bounce', gifUrl: G('3oz8xVcc2f7Z5X4gW4') },
  { id: 'w19', wordKz: 'Аға',       transliteration: 'Ağa',          category: 'family', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Үлкен ағай / аға. Екі саусақты маңдайдан жоғары көтеру.',                       gesture: 'V белгісі (маңдай)',   emoji: '👦', animation: 'bounce', gifUrl: G('26xBByfJgR0qWNm1i') },
  { id: 'w20', wordKz: 'Сіңлі',     transliteration: 'Siñli',        category: 'family', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Кіші қарындас. L белгісін иектен төмен сипау.',                                  gesture: 'L белгісі (иек)',      emoji: '👧', animation: 'bounce', gifUrl: G('3o7TKKYQk05pQ2ZQA0') },
  { id: 'w21', wordKz: 'Әже',       transliteration: 'Äzhe',         category: 'family', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Әже. Иекке тигізіп, алға екі рет бұлғау.',                                      gesture: 'Алақан (иек, алға)',   emoji: '👵', animation: 'wave',   gifUrl: G('l0HlOTde1r9OHFkfC') },
  { id: 'w22', wordKz: 'Ата',       transliteration: 'Ata',          category: 'family', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Ата. Маңдайға тигізіп, алға екі рет бұлғау.',                                   gesture: 'Алақан (маңд., алға)', emoji: '👴', animation: 'wave',   gifUrl: G('3o6ZsU83yCtYlFsFIA') },
  { id: 'w23', wordKz: 'Отбасы',    transliteration: 'Otbasy',       category: 'family', difficulty: 'ҚИЫН',   color: '#EF4444', description: 'Отбасы. Екі қолмен шеңбер жасау.',                                              gesture: 'Шеңбер (екі қол)',     emoji: '👨‍👩‍👧‍👦', animation: 'pulse', gifUrl: G('3o7TKABBJNeB3b3vxe') },

  // ═══════════════ МЕКТЕП (8) ═══════════════
  { id: 'w24', wordKz: 'Кітап',     transliteration: 'Kitap',        category: 'school', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Кітап. Екі алақанды ашып-жабу.',                                                 gesture: 'Кітап ашу',            emoji: '📖', animation: 'pulse' },
  { id: 'w25', wordKz: 'Мұғалім',   transliteration: 'Muğalim',      category: 'school', difficulty: 'ҚИЫН',   color: '#EF4444', description: 'Оқытушы. Екі қолмен маңдайдан алға ишарат.',                                    gesture: 'Екі қол (маңдай)',     emoji: '🧑‍🏫', animation: 'wave' },
  { id: 'w26', wordKz: 'Оқу',       transliteration: 'Oqu',          category: 'school', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Оқу, білім алу. Ашық кітап қимылы.',                                            gesture: 'Кітап (қарау)',        emoji: '📚', animation: 'pulse' },
  { id: 'w27', wordKz: 'Жазу',      transliteration: 'Zhazu',        category: 'school', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Жазу. Қалам ұстағандай қимыл.',                                                 gesture: 'Қалам ұстау',         emoji: '✏️', animation: 'shake' },
  { id: 'w28', wordKz: 'Сынып',     transliteration: 'Synyp',        category: 'school', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Сынып бөлмесі. Екі қолмен төбе және қабырғаны көрсету.',                        gesture: 'Үй (екі қол)',        emoji: '🏫', animation: 'pulse' },
  { id: 'w29', wordKz: 'Емтихан',   transliteration: 'Emtihan',      category: 'school', difficulty: 'ҚИЫН',   color: '#EF4444', description: 'Сынақ, тест. Екі қолмен сұрақ-жауап ишарат.',                                  gesture: 'Саусақ (сұрақ)',       emoji: '📝', animation: 'shake' },
  { id: 'w30', wordKz: 'Қалам',     transliteration: 'Qalam',        category: 'school', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Жазу құралы. Саусақпен хатта жазу қимылы.',                                     gesture: 'Жазу қимылы',         emoji: '🖊️', animation: 'pulse' },
  { id: 'w31', wordKz: 'Сабақ',     transliteration: 'Sabaq',        category: 'school', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Дәріс, сабақ. Тақтадан оқыту қимылы.',                                           gesture: 'Тақта қимылы',        emoji: '📋', animation: 'wave' },

  // ═══════════════ САНДАР (10) ═══════════════
  { id: 'w32', wordKz: 'Бір',   transliteration: 'Bir',   category: 'numbers', difficulty: 'ОҢАЙ', color: '#10B981', description: '1 — Сұқ саусақты көтеру.',            gesture: 'Сұқ саусақ',    emoji: '1️⃣', animation: 'pulse' },
  { id: 'w33', wordKz: 'Екі',   transliteration: 'Eki',   category: 'numbers', difficulty: 'ОҢАЙ', color: '#10B981', description: '2 — Сұқ және ортаңғы саусақ.',          gesture: 'V белгісі',    emoji: '2️⃣', animation: 'pulse' },
  { id: 'w34', wordKz: 'Үш',    transliteration: 'Üsh',   category: 'numbers', difficulty: 'ОҢАЙ', color: '#10B981', description: '3 — Үш саусақты көтеру.',               gesture: 'W белгісі',    emoji: '3️⃣', animation: 'pulse' },
  { id: 'w35', wordKz: 'Төрт',  transliteration: 'Tört',  category: 'numbers', difficulty: 'ОҢАЙ', color: '#10B981', description: '4 — Бас бармақтан басқа төрт саусақ.',   gesture: 'Төрт саусақ',  emoji: '4️⃣', animation: 'pulse' },
  { id: 'w36', wordKz: 'Бес',   transliteration: 'Bes',   category: 'numbers', difficulty: 'ОҢАЙ', color: '#10B981', description: '5 — Барлық саусақтарды ашу.',            gesture: 'Ашық алақан',  emoji: '5️⃣', animation: 'wave' },
  { id: 'w37', wordKz: 'Алты',  transliteration: 'Alty',  category: 'numbers', difficulty: 'ОРТАША', color: '#F59E0B', description: '6 — Бір қолда бес + екінші бас бармақ.', gesture: 'Бес + бірмін',  emoji: '6️⃣', animation: 'pulse' },
  { id: 'w38', wordKz: 'Жеті',  transliteration: 'Zheti', category: 'numbers', difficulty: 'ОРТАША', color: '#F59E0B', description: '7 — Бір қолда бес + екінші V.',         gesture: 'Бес + екімін',  emoji: '7️⃣', animation: 'pulse' },
  { id: 'w39', wordKz: 'Сегіз', transliteration: 'Segiz', category: 'numbers', difficulty: 'ОРТАША', color: '#F59E0B', description: '8 — Бір қолда бес + үш.',              gesture: 'Бес + үшмін',  emoji: '8️⃣', animation: 'pulse' },
  { id: 'w40', wordKz: 'Тоғыз', transliteration: 'Toğyz', category: 'numbers', difficulty: 'ОРТАША', color: '#F59E0B', description: '9 — Бір қолда бес + төрт.',             gesture: 'Бес + төртмін', emoji: '9️⃣', animation: 'pulse' },
  { id: 'w41', wordKz: 'Он',    transliteration: 'On',    category: 'numbers', difficulty: 'ОҢАЙ', color: '#10B981', description: '10 — Бас бармақты жоғары бұлғау.',        gesture: 'Бас бармақ (бұлғау)', emoji: '🔟', animation: 'bounce' },

  // ═══════════════ ТҮСТЕР (7) ═══════════════
  { id: 'w42', wordKz: 'Қызыл', transliteration: 'Qyzyl', category: 'colors', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Қызыл түс. Ерінді саусақпен төмен сипау.',       gesture: 'Сұқ саусақ (ерін)',  emoji: '🔴', animation: 'pulse' },
  { id: 'w43', wordKz: 'Көк',   transliteration: 'Kök',   category: 'colors', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Көк түс. K әрпін жасап, қолды бұлғау.',           gesture: 'K белгісі (бұлғау)', emoji: '🔵', animation: 'wave' },
  { id: 'w44', wordKz: 'Жасыл', transliteration: 'Zhasyl', category: 'colors', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Жасыл түс. G әрпін жасап, шайқау.',               gesture: 'G белгісі (шайқау)', emoji: '🟢', animation: 'shake' },
  { id: 'w45', wordKz: 'Сары',  transliteration: 'Sary',  category: 'colors', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Сары түс. Y әрпін жасап, бұлғау.',                  gesture: 'Y белгісі (бұлғау)', emoji: '🟡', animation: 'wave' },
  { id: 'w46', wordKz: 'Ақ',    transliteration: 'Aq',    category: 'colors', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Ақ түс. Кеудеден алақанды алға тарту.',               gesture: 'Алақан (кеуде)',     emoji: '⚪', animation: 'pulse' },
  { id: 'w47', wordKz: 'Қара',  transliteration: 'Qara',  category: 'colors', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Қара түс. Маңдайды саусақпен сипау.',                 gesture: 'Саусақ (маңдай)',    emoji: '⚫', animation: 'pulse' },
  { id: 'w48', wordKz: 'Қоңыр', transliteration: 'Qoñyr', category: 'colors', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Қоңыр түс. B әрпін жасап, бетте төмен жылжыту.',   gesture: 'B белгісі (бет)',    emoji: '🟤', animation: 'pulse' },

  // ═══════════════ СЕЗІМДЕР (6) ═══════════════
  { id: 'w49', wordKz: 'Қуаныш',  transliteration: 'Quanysh',  category: 'emotions', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Қуаныш. Кеудеде дөңгелек қимыл жоғары.',        gesture: 'Алақан (кеуде, жоғары)', emoji: '😊', animation: 'bounce', gifUrl: G('3o7TKFpahYpUp4g0N2') },
  { id: 'w50', wordKz: 'Ренжу',   transliteration: 'Renzhu',   category: 'emotions', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Ренжу, күйзелу. Екі қолды көзден төмен.',     gesture: 'Көз жасы',               emoji: '😢', animation: 'pulse',  gifUrl: G('3o7TKVhsMTczdAzMB2') },
  { id: 'w51', wordKz: 'Ашу',     transliteration: 'Ashu',     category: 'emotions', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Ашу, ыза. Саусақтарды жұдырыққа бүгіп, жоғары.', gesture: 'Жұдырық (жоғары)',     emoji: '😠', animation: 'shake',  gifUrl: G('3o7TKvsHER8leUJvAQ') },
  { id: 'w52', wordKz: 'Қорқу',   transliteration: 'Qorqu',    category: 'emotions', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Қорқу. Екі қолды кеуденің алдында шайқау.',    gesture: 'Екі қол (шайқау)',       emoji: '😨', animation: 'shake' },
  { id: 'w53', wordKz: 'Таңдану', transliteration: 'Tañdanu',  category: 'emotions', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Таңғалу. Екі қолды ашық ұстау.',                gesture: 'Ашық алақан (екі қол)', emoji: '😮', animation: 'wave' },
  { id: 'w54', wordKz: 'Жалқау',  transliteration: 'Zhalqau',  category: 'emotions', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Жалқау. Қолды иыққа қойып, еңкею.',              gesture: 'Қол (иық)',              emoji: '😴', animation: 'pulse' },

  // ═══════════════ ТАҒАМ (6) ═══════════════
  { id: 'w55', wordKz: 'Нан',    transliteration: 'Nan',    category: 'food', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Нан. Екі қолмен сындыру қимылы.',                  gesture: 'Екі қол (сындыру)',  emoji: '🍞', animation: 'pulse',  gifUrl: G('l0MYQ98VjXVUzm2Mo') },
  { id: 'w56', wordKz: 'Су',     transliteration: 'Su',     category: 'food', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Су. W әрпін иекке тигізу.',                        gesture: 'W (иекке)',          emoji: '💧', animation: 'pulse' },
  { id: 'w57', wordKz: 'Сүт',    transliteration: 'Süt',    category: 'food', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Сүт. Сауу қимылы.',                                 gesture: 'Сауу қимылы',       emoji: '🥛', animation: 'bounce', gifUrl: G('3o7TKIeb4GHExS3atG') },
  { id: 'w58', wordKz: 'Алма',   transliteration: 'Alma',   category: 'food', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Алма. Жұдырықпен жақты бұрау.',                     gesture: 'Жұдырық (жақ)',      emoji: '🍎', animation: 'bounce' },
  { id: 'w59', wordKz: 'Ет',     transliteration: 'Et',     category: 'food', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Ет. Бас бармақ пен сұқ саусақ арасын шымшу.',      gesture: 'Шымшу қимылы',      emoji: '🥩', animation: 'pulse' },
  { id: 'w60', wordKz: 'Шай',    transliteration: 'Shay',   category: 'food', difficulty: 'ОҢАЙ',   color: '#10B981', description: 'Шай ішу. Кесені ұстағандай қимыл, аузға жақындату.', gesture: 'Кесе (аузға)',       emoji: '🍵', animation: 'pulse' },
]
