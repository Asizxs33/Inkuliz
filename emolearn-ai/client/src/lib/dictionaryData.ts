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
]

export const DICTIONARY_DATA: DictionaryWord[] = [
  // Негізгі
  { id: 'w1', wordKz: 'Сәлем', transliteration: 'Salem (Сәлем)', category: 'basic', difficulty: 'ОҢАЙ', color: '#10B981', description: 'Күнделікті амандасу үшін қолданылады. Қолды бос ұстап, алақанды қаратып бұлғау керек.', gesture: 'Ашық алақан', emoji: '👋', animation: 'wave', gifUrl: 'https://media.giphy.com/media/l41Ys1fQky5raqvMQ/giphy.gif' },
  { id: 'w2', wordKz: 'Жақсы', transliteration: 'Zhaqsy (Жақсы)', category: 'basic', difficulty: 'ОҢАЙ', color: '#10B981', description: 'Бір нәрсе көңіліңізден шыққанда немесе келісім білдіргенде.', gesture: 'Бас бармақ жоғары', emoji: '👍', animation: 'bounce', gifUrl: 'https://media.giphy.com/media/26FPEB9Kpq7gGtoQ0/giphy.gif' },
  { id: 'w3', wordKz: 'Рахмет', transliteration: 'Rakhmet (Рахмет/Рақмет)', category: 'basic', difficulty: 'ОҢАЙ', color: '#10B981', description: 'Ризашылық, алғыс білдіру үшін қолданылады.', gesture: 'OK белгісі', emoji: '👌', animation: 'pulse', gifUrl: 'https://media.giphy.com/media/3o7TKLdB2Z2Sls2h9K/giphy.gif' },
  { id: 'w4', wordKz: 'Мен', transliteration: 'Men (Мен)', category: 'basic', difficulty: 'ОҢАЙ', color: '#10B981', description: 'Өзін көрсету немесе өзі туралы айтқанда. Сұқ саусақпен өзін көрсету.', gesture: 'Сұқ саусақ', emoji: '☝️', animation: 'bounce' },
  { id: 'w5', wordKz: 'Сіз', transliteration: 'Siz (Сіз)', category: 'basic', difficulty: 'ОҢАЙ', color: '#10B981', description: 'Сұхбаттасушыға құрметпен жүгіну.', gesture: 'V белгісі', emoji: '👉', animation: 'pulse' },
  { id: 'w6', wordKz: 'Сүйемін', transliteration: 'Suıemin (Сүйемін/Жақсы көремін)', category: 'basic', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Махаббат, жылы сезім білдіру үшін (ILY белгісі).', gesture: 'ILY белгісі', emoji: '🤟', animation: 'pulse' },
  { id: 'w7', wordKz: 'Стоп', transliteration: 'Stop (Тоқта)', category: 'basic', difficulty: 'ОҢАЙ', color: '#10B981', description: 'Ескерту, тоқтату мағынасында. Қолды жұдырық түрінде түю.', gesture: 'Жұдырық', emoji: '✊', animation: 'shake' },
  { id: 'w8', wordKz: 'Телефон', transliteration: 'Telefon (Телефон)', category: 'basic', difficulty: 'ОҢАЙ', color: '#10B981', description: 'Қоңырау шалу, сөйлесу. Шака белгісімен ауызға жақындату.', gesture: 'Шака белгісі', emoji: '🤙', animation: 'shake' },
  
  // Отбасы
  { id: 'w9', wordKz: 'Ана', transliteration: 'Ana (Ана)', category: 'family', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Отбасындағы ең жақын адам. Бас бармақты иекке тигізіп, саусақтарды ашық ұстау.', gesture: 'Ашық алақан (иекке)', emoji: '👩‍👧', animation: 'bounce' },
  { id: 'w10', wordKz: 'Әке', transliteration: 'Ake (Әке)', category: 'family', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Отбасының тірегі. Бас бармақты маңдайға тигізіп, саусақтарды ашық ұстау.', gesture: 'Ашық алақан (маңдайға)', emoji: '👨‍👦', animation: 'bounce' },
  
  // Мектеп
  { id: 'w11', wordKz: 'Кітап', transliteration: 'Kitap (Кітап)', category: 'school', difficulty: 'ОҢАЙ', color: '#10B981', description: 'Білім бұлағы, оқуға арналған. Екі алақанды ашып жүйелі түрде біріктіру.', gesture: 'Кітап ашу', emoji: '📖', animation: 'pulse' },
  { id: 'w12', wordKz: 'Мұғалім', transliteration: 'Mugalim (Мұғалім)', category: 'school', difficulty: 'ҚИЫН', color: '#EF4444', description: 'Оқытушы, білім беруші тұлға. Екі қолмен оқыту қимылын көрсету.', gesture: 'Жұдырық (алға)', emoji: '🧑‍🏫', animation: 'wave' },
  
  // Сандар
  { id: 'w13', wordKz: 'Бір', transliteration: 'Bir (Бір)', category: 'numbers', difficulty: 'ОҢАЙ', color: '#10B981', description: 'Сан санау басы.', gesture: 'Сұқ саусақ', emoji: '1️⃣', animation: 'pulse' },
  { id: 'w14', wordKz: 'Екі', transliteration: 'Eki (Екі)', category: 'numbers', difficulty: 'ОҢАЙ', color: '#10B981', description: 'Екінші сан.', gesture: 'V белгісі', emoji: '2️⃣', animation: 'pulse' },
  { id: 'w15', wordKz: 'Үш', transliteration: 'Ush (Үш)', category: 'numbers', difficulty: 'ОҢАЙ', color: '#10B981', description: 'Үшінші сан. Үш саусақты көтеру.', gesture: 'W белгісі', emoji: '3️⃣', animation: 'pulse' },
  
  // Түстер
  { id: 'w16', wordKz: 'Қызыл', transliteration: 'Qyzyl (Қызыл)', category: 'colors', difficulty: 'ОРТАША', color: '#F59E0B', description: 'Ерінді сұқ саусақпен төмен қарай бір рет сипау.', gesture: 'Сұқ саусақ', emoji: '🔴', animation: 'pulse' },
  { id: 'w17', wordKz: 'Көк', transliteration: 'Kok (Көк)', category: 'colors', difficulty: 'ОРТАША', color: '#F59E0B', description: 'B (Би) әрпін жасап, қолды оңға-солға бұлғау.', gesture: 'Ашық алақан', emoji: '🔵', animation: 'wave' },
]
