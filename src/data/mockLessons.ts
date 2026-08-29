export type LessonType = 'vocabulary' | 'story' | 'pronunciation' | 'grammar' | 'conversation'
export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface MockLesson {
  id: string
  title: string
  nativeTitle: string     // Title in the target language
  type: LessonType
  difficulty: LessonDifficulty
  languageId: string
  grade: number
  durationMinutes: number
  xpReward: number
  completed: boolean
  progress: number        // 0–100
  description: string
  vocabulary?: VocabItem[]
}

export interface VocabItem {
  word: string
  meaning: string
  pronunciation: string
  example: string
}

export const MOCK_LESSONS: MockLesson[] = [
  {
    id: 'lesson-hi-001',
    title: 'Animals Around Us',
    nativeTitle: 'हमारे आसपास के जानवर',
    type: 'vocabulary',
    difficulty: 'beginner',
    languageId: 'hi',
    grade: 2,
    durationMinutes: 10,
    xpReward: 50,
    completed: true,
    progress: 100,
    description: 'Learn the names of common animals in Hindi.',
    vocabulary: [
      { word: 'बिल्ली',  meaning: 'Cat',     pronunciation: 'Billi',   example: 'बिल्ली दूध पीती है।' },
      { word: 'कुत्ता',  meaning: 'Dog',     pronunciation: 'Kutta',   example: 'कुत्ता भौंकता है।' },
      { word: 'गाय',    meaning: 'Cow',     pronunciation: 'Gaay',    example: 'गाय घास खाती है।' },
      { word: 'पक्षी',  meaning: 'Bird',    pronunciation: 'Pakshi',  example: 'पक्षी आसमान में उड़ते हैं।' },
    ],
  },
  {
    id: 'lesson-hi-002',
    title: 'My Family',
    nativeTitle: 'मेरा परिवार',
    type: 'vocabulary',
    difficulty: 'beginner',
    languageId: 'hi',
    grade: 2,
    durationMinutes: 12,
    xpReward: 50,
    completed: true,
    progress: 100,
    description: 'Learn family relationship words in Hindi.',
    vocabulary: [
      { word: 'माँ',   meaning: 'Mother', pronunciation: 'Maa',    example: 'मेरी माँ खाना बनाती है।' },
      { word: 'पिता',  meaning: 'Father', pronunciation: 'Pita',   example: 'मेरे पिता काम पर जाते हैं।' },
      { word: 'भाई',   meaning: 'Brother',pronunciation: 'Bhai',   example: 'मेरा भाई खेलता है।' },
      { word: 'बहन',   meaning: 'Sister', pronunciation: 'Behen',  example: 'मेरी बहन पढ़ती है।' },
    ],
  },
  {
    id: 'lesson-hi-003',
    title: 'Colours and Shapes',
    nativeTitle: 'रंग और आकार',
    type: 'vocabulary',
    difficulty: 'beginner',
    languageId: 'hi',
    grade: 3,
    durationMinutes: 15,
    xpReward: 60,
    completed: false,
    progress: 40,
    description: 'Discover colours and basic shapes in Hindi.',
    vocabulary: [
      { word: 'लाल',    meaning: 'Red',    pronunciation: 'Laal',   example: 'सेब लाल है।' },
      { word: 'नीला',   meaning: 'Blue',   pronunciation: 'Neela',  example: 'आसमान नीला है।' },
      { word: 'गोल',    meaning: 'Round',  pronunciation: 'Gol',    example: 'चाँद गोल है।' },
    ],
  },
  {
    id: 'lesson-hi-004',
    title: 'A Day at School',
    nativeTitle: 'विद्यालय का एक दिन',
    type: 'story',
    difficulty: 'intermediate',
    languageId: 'hi',
    grade: 3,
    durationMinutes: 20,
    xpReward: 80,
    completed: false,
    progress: 0,
    description: 'Read a short story about a day at school and answer questions.',
  },
  {
    id: 'lesson-hi-005',
    title: 'Greetings & Conversations',
    nativeTitle: 'अभिवादन और बातचीत',
    type: 'conversation',
    difficulty: 'beginner',
    languageId: 'hi',
    grade: 2,
    durationMinutes: 8,
    xpReward: 40,
    completed: false,
    progress: 0,
    description: 'Practice simple greetings and everyday conversations.',
  },
  {
    id: 'lesson-ta-001',
    title: 'Numbers 1–10',
    nativeTitle: 'எண்கள் 1–10',
    type: 'vocabulary',
    difficulty: 'beginner',
    languageId: 'ta',
    grade: 1,
    durationMinutes: 10,
    xpReward: 50,
    completed: true,
    progress: 100,
    description: 'Learn Tamil numbers from one to ten.',
  },
  {
    id: 'lesson-ta-002',
    title: 'Body Parts',
    nativeTitle: 'உடல் உறுப்புகள்',
    type: 'vocabulary',
    difficulty: 'beginner',
    languageId: 'ta',
    grade: 2,
    durationMinutes: 12,
    xpReward: 55,
    completed: false,
    progress: 60,
    description: 'Identify and name parts of the body in Tamil.',
  },
]

/** Get lessons filtered by languageId and/or grade */
export function getLessons(languageId?: string, grade?: number): MockLesson[] {
  let results = MOCK_LESSONS
  if (languageId) results = results.filter((l) => l.languageId === languageId)
  if (grade !== undefined) results = results.filter((l) => l.grade === grade)
  return results
}

/** Get the next incomplete lesson for a language */
export function getNextLesson(languageId: string): MockLesson | undefined {
  return MOCK_LESSONS.find((l) => l.languageId === languageId && !l.completed)
}
