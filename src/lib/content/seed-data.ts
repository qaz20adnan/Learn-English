import type { Level, QuestionType } from '../types';

export interface SeedMedia {
  key: string;
  url: string;
  title: string;
}

export interface SeedLesson {
  slug: string;
  title: string;
  titleAr?: string;
  summary: string;
  content: string;
  transcript?: string;
  durationMinutes: number;
  mediaKey?: string;
}

export interface SeedVocabulary {
  term: string;
  translation: string;
  partOfSpeech?: string;
  phonetic?: string;
  example?: string;
}

export interface SeedCourse {
  slug: string;
  title: string;
  titleAr: string;
  description: string;
  level: Level;
  category: string;
  coverEmoji: string;
  accent: string;
  lessons: SeedLesson[];
  vocabulary: SeedVocabulary[];
}

export interface SeedStory {
  slug: string;
  title: string;
  titleAr: string;
  level: Level;
  coverEmoji: string;
  summary: string;
  body: string;
  questions: { prompt: string; options: string[]; answerIndex: number; explanation: string }[];
}

export interface SeedQuizQuestion {
  type: QuestionType;
  prompt: string;
  /** For MULTIPLE_CHOICE. */
  options?: string[];
  /** For MULTIPLE_CHOICE. */
  answerIndex?: number;
  /** For FILL_BLANK. */
  acceptedAnswers?: string[];
  /** For TRUE_FALSE. */
  correctBoolean?: boolean;
  points?: number;
  explanation?: string;
}

export interface SeedQuiz {
  slug: string;
  title: string;
  titleAr: string;
  description: string;
  level: Level;
  courseSlug?: string;
  lessonSlug?: string;
  questions: SeedQuizQuestion[];
}

export const SEED_MEDIA: SeedMedia[] = [
  {
    key: 'yt-iframe-demo',
    url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    title: 'YouTube IFrame Player API — official sample',
  },
  {
    key: 'yt-public-talk',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Public YouTube video — embed check',
  },
  {
    key: 'vimeo-sample',
    url: 'https://vimeo.com/1084537',
    title: 'Vimeo embeddable sample',
  },
  {
    key: 'audio-sample-1',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    title: 'Listening practice audio (sample MP3)',
  },
  {
    key: 'audio-sample-2',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    title: 'Listening practice audio (sample MP3 2)',
  },
  {
    key: 'video-sample-1',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    title: 'MDN CC0 sample video (flower)',
  },
  {
    key: 'video-sample-2',
    url: 'https://download.samplelib.com/mp4/sample-5s.mp4',
    title: 'SampleLib short MP4',
  },
  {
    key: 'fixture-invalid-url',
    url: 'https://example.com/not-a-media-file',
    title: 'Fixture: invalid media URL (expected: needs review)',
  },
  {
    key: 'fixture-unavailable',
    url: 'https://vimeo.com/76979871',
    title: 'Fixture: removed Vimeo video (expected: unavailable)',
  },
];

export const SEED_COURSES: SeedCourse[] = [
  {
    slug: 'english-foundations',
    title: 'English Foundations',
    titleAr: 'أساسيات الإنجليزية',
    description:
      'A friendly starting point: greetings, self-introductions and the present simple for everyday conversation.',
    level: 'foundation',
    category: 'general',
    coverEmoji: '🌱',
    accent: 'emerald',
    lessons: [
      {
        slug: 'greetings-and-introductions',
        title: 'Greetings and Introductions',
        titleAr: 'التحية والتعريف بالنفس',
        summary: 'Learn how to greet people and introduce yourself in formal and casual settings.',
        content: `# Greetings and Introductions

**Hello! My name is Sara. I am a student.**

In English, the way you greet someone depends on the situation:

- **Formal:** Good morning / Good afternoon / Good evening.
- **Neutral:** Hello, nice to meet you.
- **Casual:** Hi! Hey! What's up?

When you meet someone for the first time you can say:

> "Nice to meet you. I'm Sara."

The answer is: **"Nice to meet you too."**

## Practice

1. Say hello to a colleague in the morning.
2. Introduce yourself using your name and your job.`,
        transcript:
          'Hello, my name is Sara. Nice to meet you. I am a teacher and I live in Cairo.',
        durationMinutes: 6,
        mediaKey: 'audio-sample-1',
      },
      {
        slug: 'the-verb-to-be',
        title: 'The verb "to be"',
        titleAr: 'فعل الكينونة',
        summary: 'Master am / is / are, the most common verbs in English.',
        content: `# The verb "to be"

| Subject | Verb |
| --- | --- |
| I | am |
| You / We / They | are |
| He / She / It | is |

Examples:

- **I am** ready.
- **She is** my sister.
- **They are** from Canada.

Negative form: add **not** → I am **not** tired.

Question form: swap the order → **Are** you tired?`,
        durationMinutes: 7,
      },
      {
        slug: 'present-simple',
        title: 'The Present Simple',
        titleAr: 'المضارع البسيط',
        summary: 'Talk about routines, habits and facts.',
        content: `# The Present Simple

We use the present simple for habits and facts.

- I **work** every day.
- He **works** in a hospital. (note the **-s**)
- They **don't like** coffee.

Questions use **do / does**:

> **Do** you speak English? — Yes, I **do**.
> **Does** she live here? — No, she **doesn't**.`,
        durationMinutes: 8,
        mediaKey: 'video-sample-1',
      },
    ],
    vocabulary: [
      { term: 'hello', translation: 'مرحبًا', partOfSpeech: 'interjection', phonetic: '/həˈloʊ/', example: 'Hello, how are you?' },
      { term: 'morning', translation: 'صباح', partOfSpeech: 'noun', phonetic: '/ˈmɔːrnɪŋ/', example: 'Good morning!' },
      { term: 'student', translation: 'طالب', partOfSpeech: 'noun', phonetic: '/ˈstuːdənt/', example: 'I am a student.' },
      { term: 'work', translation: 'يعمل / عمل', partOfSpeech: 'verb', phonetic: '/wɜːrk/', example: 'I work every day.' },
      { term: 'always', translation: 'دائمًا', partOfSpeech: 'adverb', phonetic: '/ˈɔːlweɪz/', example: 'She always arrives early.' },
      { term: 'friend', translation: 'صديق', partOfSpeech: 'noun', phonetic: '/frend/', example: 'He is my best friend.' },
      { term: 'family', translation: 'عائلة', partOfSpeech: 'noun', phonetic: '/ˈfæməli/', example: 'I love my family.' },
    ],
  },
  {
    slug: 'daily-conversation',
    title: 'Daily Conversation',
    titleAr: 'المحادثة اليومية',
    description: 'Shopping, ordering food and asking for directions with confidence.',
    level: 'a2',
    category: 'speaking',
    coverEmoji: '💬',
    accent: 'sky',
    lessons: [
      {
        slug: 'shopping-for-groceries',
        title: 'Shopping for Groceries',
        titleAr: 'التسوق',
        summary: 'Ask for prices, quantities and pay at the checkout.',
        content: `# Shopping for Groceries

Useful phrases:

- **How much is this?**
- **Do you have any fresh bread?**
- **I'd like two kilos of apples, please.**
- **Can I pay by card?**

Vocabulary: *a receipt*, *a discount*, *a shopping list*.`,
        durationMinutes: 6,
        mediaKey: 'video-sample-2',
      },
      {
        slug: 'ordering-food',
        title: 'Ordering Food',
        titleAr: 'طلب الطعام',
        summary: 'Order at a restaurant politely.',
        content: `# Ordering Food

Waiter: **Are you ready to order?**
You: **Yes, I'll have the grilled chicken, please.**
Waiter: **Anything to drink?**
You: **Just water, thank you.**

Tip: add **please** and **thank you** to sound friendly.`,
        durationMinutes: 5,
        mediaKey: 'yt-iframe-demo',
      },
      {
        slug: 'asking-for-directions',
        title: 'Asking for Directions',
        titleAr: 'السؤال عن الاتجاهات',
        summary: 'Find your way around a new city.',
        content: `# Asking for Directions

- **Excuse me, where is the train station?**
- **Go straight, then turn left at the traffic lights.**
- **It's about five minutes on foot.**

Key words: *opposite*, *next to*, *behind*, *between*.`,
        durationMinutes: 6,
      },
    ],
    vocabulary: [
      { term: 'price', translation: 'سعر', partOfSpeech: 'noun', phonetic: '/praɪs/', example: 'What is the price?' },
      { term: 'receipt', translation: 'إيصال', partOfSpeech: 'noun', phonetic: '/rɪˈsiːt/', example: 'Keep your receipt.' },
      { term: 'order', translation: 'يطلب / طلب', partOfSpeech: 'verb', phonetic: '/ˈɔːrdər/', example: "I'd like to order now." },
      { term: 'straight', translation: 'مستقيم', partOfSpeech: 'adverb', phonetic: '/streɪt/', example: 'Go straight ahead.' },
      { term: 'left', translation: 'يسار', partOfSpeech: 'noun', phonetic: '/left/', example: 'Turn left at the corner.' },
      { term: 'right', translation: 'يمين', partOfSpeech: 'noun', phonetic: '/raɪt/', example: 'The bank is on your right.' },
      { term: 'menu', translation: 'قائمة الطعام', partOfSpeech: 'noun', phonetic: '/ˈmenjuː/', example: 'Could I see the menu?' },
    ],
  },
  {
    slug: 'workplace-english',
    title: 'Workplace English',
    titleAr: 'إنجليزية العمل',
    description: 'Emails, meetings and professional small talk.',
    level: 'b1',
    category: 'business',
    coverEmoji: '💼',
    accent: 'violet',
    lessons: [
      {
        slug: 'writing-a-professional-email',
        title: 'Writing a Professional Email',
        titleAr: 'كتابة بريد إلكتروني مهني',
        summary: 'Structure, tone and useful phrases for work emails.',
        content: `# Writing a Professional Email

A clear structure:

1. **Subject:** short and specific.
2. **Greeting:** Dear Ms. Hassan,
3. **Body:** one idea per paragraph.
4. **Closing:** Best regards, / Kind regards,

Useful phrases: *I am writing to follow up on…*, *Please find attached…*, *Let me know if you have any questions.*`,
        durationMinutes: 9,
      },
      {
        slug: 'leading-a-meeting',
        title: 'Leading a Meeting',
        titleAr: 'إدارة اجتماع',
        summary: 'Open, guide and wrap up a meeting.',
        content: `# Leading a Meeting

- **Thanks everyone for joining.**
- **Today's agenda has three items.**
- **Let's move on to the next point.**
- **To sum up, we agreed to…**

Keep sentences short and confirm action items at the end.`,
        durationMinutes: 8,
        mediaKey: 'vimeo-sample',
      },
      {
        slug: 'small-talk-at-work',
        title: 'Small Talk at Work',
        titleAr: 'الحديث الجانبي في العمل',
        summary: 'Build relationships with light conversation.',
        content: `# Small Talk at Work

Safe topics: the weekend, the weather, sports, food.

- **How was your weekend?**
- **Did you watch the match?**
- **I tried a new café, it was great.**

Avoid: salary, politics, religion.`,
        durationMinutes: 6,
        mediaKey: 'audio-sample-2',
      },
    ],
    vocabulary: [
      { term: 'deadline', translation: 'موعد نهائي', partOfSpeech: 'noun', phonetic: '/ˈdedlaɪn/', example: 'The deadline is Friday.' },
      { term: 'agenda', translation: 'جدول الأعمال', partOfSpeech: 'noun', phonetic: '/əˈdʒendə/', example: "Let's review the agenda." },
      { term: 'attach', translation: 'يُرفق', partOfSpeech: 'verb', phonetic: '/əˈtætʃ/', example: 'I will attach the file.' },
      { term: 'follow up', translation: 'يتابع', partOfSpeech: 'verb', phonetic: '/ˈfɑːloʊ ʌp/', example: 'I will follow up tomorrow.' },
      { term: 'colleague', translation: 'زميل', partOfSpeech: 'noun', phonetic: '/ˈkɑːliːɡ/', example: 'She is my colleague.' },
      { term: 'schedule', translation: 'جدول مواعيد', partOfSpeech: 'noun', phonetic: '/ˈskedʒuːl/', example: 'My schedule is full today.' },
      { term: 'confirm', translation: 'يؤكد', partOfSpeech: 'verb', phonetic: '/kənˈfɜːrm/', example: 'Please confirm the meeting.' },
    ],
  },
  {
    slug: 'travel-and-culture',
    title: 'Travel & Culture',
    titleAr: 'السفر والثقافة',
    description: 'Airports, hotels and talking about cultures.',
    level: 'b2',
    category: 'travel',
    coverEmoji: '✈️',
    accent: 'amber',
    lessons: [
      {
        slug: 'at-the-airport',
        title: 'At the Airport',
        titleAr: 'في المطار',
        summary: 'Check in, go through security and board.',
        content: `# At the Airport

- **Where is the check-in counter for flight AB123?**
- **May I see your passport, please?**
- **Is the flight delayed?**

Words: *boarding pass*, *gate*, *luggage*, *customs*.`,
        durationMinutes: 7,
        mediaKey: 'yt-iframe-demo',
      },
      {
        slug: 'checking-into-a-hotel',
        title: 'Checking into a Hotel',
        titleAr: 'تسجيل الوصول في فندق',
        summary: 'Reserve a room and ask about facilities.',
        content: `# Checking into a Hotel

- **I have a reservation under the name Ali.**
- **Could I have a room with a view?**
- **What time is breakfast served?**
- **Is Wi-Fi included?**

Words: *twin room*, *key card*, *reception*, *checkout*.`,
        durationMinutes: 6,
      },
      {
        slug: 'talking-about-culture',
        title: 'Talking about Culture',
        titleAr: 'الحديث عن الثقافة',
        summary: 'Describe traditions and compare cultures.',
        content: `# Talking about Culture

- **In my country, we celebrate…**
- **What is this festival about?**
- **It is similar to / different from…**

Careful: use respectful, open questions.`,
        durationMinutes: 6,
        mediaKey: 'video-sample-1',
      },
    ],
    vocabulary: [
      { term: 'passport', translation: 'جواز سفر', partOfSpeech: 'noun', phonetic: '/ˈpæspɔːrt/', example: 'Show me your passport.' },
      { term: 'luggage', translation: 'أمتعة', partOfSpeech: 'noun', phonetic: '/ˈlʌɡɪdʒ/', example: 'My luggage is heavy.' },
      { term: 'reservation', translation: 'حجز', partOfSpeech: 'noun', phonetic: '/ˌrezərˈveɪʃn/', example: 'I have a reservation.' },
      { term: 'flight', translation: 'رحلة جوية', partOfSpeech: 'noun', phonetic: '/flaɪt/', example: 'The flight is on time.' },
      { term: 'tradition', translation: 'تقليد', partOfSpeech: 'noun', phonetic: '/trəˈdɪʃn/', example: 'It is an old tradition.' },
      { term: 'culture', translation: 'ثقافة', partOfSpeech: 'noun', phonetic: '/ˈkʌltʃər/', example: 'I love learning about culture.' },
      { term: 'ticket', translation: 'تذكرة', partOfSpeech: 'noun', phonetic: '/ˈtɪkɪt/', example: 'Here is your ticket.' },
    ],
  },
];

export const SEED_STORIES: SeedStory[] = [
  {
    slug: 'the-lost-key',
    title: 'The Lost Key',
    titleAr: 'المفتاح المفقود',
    level: 'a1',
    coverEmoji: '🔑',
    summary: 'A short story about a missing key and a helpful neighbour.',
    body: `Sami could not find his key. He looked in his bag, in his jacket and under the table.

"Where is it?" he said.

His neighbour, Mona, saw him outside the door. "Are you okay?" she asked.

"I lost my key," said Sami.

Mona smiled. "Look in your front pocket," she said.

Sami put his hand in his pocket. The key was there! "Thank you, Mona!" he laughed.

That evening, Sami made tea for Mona. They sat and talked about their day.`,
    questions: [
      {
        prompt: 'What did Sami lose?',
        options: ['His phone', 'His key', 'His bag', 'His jacket'],
        answerIndex: 1,
        explanation: 'The title and the story say Sami could not find his key.',
      },
      {
        prompt: 'Who helped Sami?',
        options: ['His brother', 'A teacher', 'His neighbour Mona', 'A stranger'],
        answerIndex: 2,
        explanation: 'Mona, his neighbour, told him where to look.',
      },
      {
        prompt: 'Where was the key?',
        options: ['Under the table', 'In his front pocket', 'In the door', 'At the shop'],
        answerIndex: 1,
        explanation: 'Mona told him to look in his front pocket, and the key was there.',
      },
    ],
  },
  {
    slug: 'a-trip-to-the-market',
    title: 'A Trip to the Market',
    titleAr: 'رحلة إلى السوق',
    level: 'a2',
    coverEmoji: '🧺',
    summary: 'Lina buys fruit and learns to ask for prices.',
    body: `On Saturday morning, Lina went to the market with her mother.

The market was busy and colourful. There were tomatoes, oranges and fresh bread.

"How much are the oranges?" asked Lina.

"Two dollars for one kilo," said the seller.

Lina bought two kilos. Her mother bought bread and cheese.

On the way home, Lina said, "I like the market. Everything smells good!"

Her mother smiled. "Next week we will buy dates," she said.`,
    questions: [
      {
        prompt: 'When did Lina go to the market?',
        options: ['Friday evening', 'Saturday morning', 'Sunday night', 'Monday afternoon'],
        answerIndex: 1,
        explanation: 'The story begins on Saturday morning.',
      },
      {
        prompt: 'How much were the oranges?',
        options: ['One dollar', 'Two dollars per kilo', 'Three dollars', 'Five dollars per kilo'],
        answerIndex: 1,
        explanation: 'The seller said two dollars for one kilo.',
      },
      {
        prompt: 'What will they buy next week?',
        options: ['Oranges', 'Cheese', 'Dates', 'Bread'],
        answerIndex: 2,
        explanation: 'The mother said they will buy dates next week.',
      },
    ],
  },
  {
    slug: 'the-new-colleague',
    title: 'The New Colleague',
    titleAr: 'الزميل الجديد',
    level: 'b1',
    coverEmoji: '👔',
    summary: 'A workplace story about first impressions and teamwork.',
    body: `A new engineer joined the team on Monday. Her name was Nadia, and she had moved from another city.

On her first day, she was quiet in the meeting. Some colleagues thought she was not interested.

The next week, a difficult bug appeared in the software. Everyone was stuck.

Nadia asked a few questions, read the code carefully, and found the problem in an hour.

"Great work," said the manager. "How did you find it so quickly?"

"I listened first," said Nadia. "Then I checked the logs."

From that day, the team learned that quiet people often notice the most.`,
    questions: [
      {
        prompt: 'When did Nadia join the team?',
        options: ['On Friday', 'On Monday', 'On Sunday', 'Last month'],
        answerIndex: 1,
        explanation: 'The story says she joined on Monday.',
      },
      {
        prompt: 'Why did some colleagues think she was not interested?',
        options: ['She was late', 'She was quiet in the meeting', 'She did not speak English', 'She refused to help'],
        answerIndex: 1,
        explanation: 'She was quiet during her first meeting.',
      },
      {
        prompt: 'What is the lesson of the story?',
        options: [
          'Quiet people can notice important details',
          'Bugs are impossible to fix',
          'Meetings are always useful',
          'Engineers should talk more',
        ],
        answerIndex: 0,
        explanation: 'The team learned that quiet people often notice the most.',
      },
    ],
  },
  {
    slug: 'my-first-day',
    title: 'My First Day',
    titleAr: 'يومي الأول',
    level: 'foundation',
    coverEmoji: '🌅',
    summary: 'Anna meets her new classmates and practises simple greetings.',
    body: `Good morning! My name is Anna. I am a new student. Today is my first day at school.

I say hello to the teacher. "Good morning, Miss Layla," I say. She smiles and says, "Welcome, Anna."

A girl sits next to me. "Hi, I am Mona. Nice to meet you," she says. "Nice to meet you too," I answer.

Mona is very kind. She shows me the classroom. There is a big board and many books.

At the end of the day I am happy. I have a new friend.`,
    questions: [
      { prompt: 'What is the girl\'s name?', options: ['Mona', 'Anna', 'Layla', 'Sara'], answerIndex: 1, explanation: 'The narrator says "My name is Anna".' },
      { prompt: 'Who is the teacher?', options: ['Mona', 'Anna', 'Miss Layla', 'Miss Sara'], answerIndex: 2, explanation: 'She greets "Miss Layla", the teacher.' },
      { prompt: 'How does Anna feel at the end of the day?', options: ['Sad', 'Tired', 'Happy', 'Angry'], answerIndex: 2, explanation: 'She says she is happy and has a new friend.' },
    ],
  },
  {
    slug: 'the-red-ball',
    title: 'The Red Ball',
    titleAr: 'الكرة الحمراء',
    level: 'a1',
    coverEmoji: '⚽',
    summary: 'Two children learn to share while playing in the park.',
    body: `Omar and his sister Leen went to the park. Omar had a red ball.

"Let's play football," said Omar.

"I want to play too," said Leen.

"Okay, but do not lose my ball," said Omar.

They played for one hour. Then the ball went over a small wall. Omar was worried.

"Don't worry," said Leen. "I can get it."

Leen found a gate and brought the ball back. Omar laughed. "You are a good sister," he said.

From that day, they always played together.`,
    questions: [
      { prompt: 'What colour was the ball?', options: ['Blue', 'Red', 'Green', 'Yellow'], answerIndex: 1, explanation: 'The ball is described as red.' },
      { prompt: 'What happened to the ball?', options: ['It was lost in the river', 'It went over a wall', 'A dog took it', 'It was broken'], answerIndex: 1, explanation: 'The ball went over a small wall.' },
      { prompt: 'Who found the ball?', options: ['Omar', 'Leen', 'A stranger', 'The park keeper'], answerIndex: 1, explanation: 'Leen found a gate and brought it back.' },
    ],
  },
  {
    slug: 'the-weekend-trip',
    title: 'The Weekend Trip',
    titleAr: 'رحلة نهاية الأسبوع',
    level: 'a2',
    coverEmoji: '🚗',
    summary: 'A family plans a short trip and deals with a delayed train.',
    body: `Last Friday, Huda and her family planned a trip to the coast. They wanted to leave early, but the train was delayed.

"How long will we wait?" asked Huda.

"About thirty minutes," said her father.

They waited on the platform and drank some tea. When the train arrived, they found good seats near the window.

The journey took two hours. When they reached the coast, the weather was sunny and warm. They walked on the beach and took many photos.

"It was worth the wait," said Huda's mother.

Huda agreed. The delay did not matter at all.`,
    questions: [
      { prompt: 'Why did the family wait at the station?', options: ['They were late', 'The train was delayed', 'They lost their tickets', 'They forgot their luggage'], answerIndex: 1, explanation: 'The train was delayed by about thirty minutes.' },
      { prompt: 'How long was the journey?', options: ['Half an hour', 'One hour', 'Two hours', 'Three hours'], answerIndex: 2, explanation: 'The journey took two hours.' },
      { prompt: 'What was the weather like at the coast?', options: ['Rainy', 'Snowy', 'Sunny and warm', 'Cold and windy'], answerIndex: 2, explanation: 'It was sunny and warm.' },
    ],
  },
  {
    slug: 'the-job-interview',
    title: 'The Job Interview',
    titleAr: 'مقابلة العمل',
    level: 'b1',
    coverEmoji: '💼',
    summary: 'Kareem prepares for an interview and learns to talk about his strengths.',
    body: `Kareem had applied for a new job as a project assistant. The interview was on Tuesday morning, and he was nervous.

At home, he wrote down his main skills: organising tasks, communicating with people, and solving problems quickly.

On the day of the interview, the manager asked, "Why do you want this job?"

Kareem took a breath and answered clearly. "I enjoy helping teams reach their goals, and I want to grow in a company like yours."

The manager nodded and asked about a difficult situation. Kareem described a project deadline that he had saved by planning each step.

A week later, Kareem received a phone call. He got the job.

"Preparation made the difference," he said.`,
    questions: [
      { prompt: 'What job did Kareem apply for?', options: ['A teacher', 'A project assistant', 'A driver', 'A manager'], answerIndex: 1, explanation: 'He applied to be a project assistant.' },
      { prompt: 'How did Kareem prepare?', options: ['He slept early', 'He wrote down his main skills', 'He called a friend', 'He read a novel'], answerIndex: 1, explanation: 'He wrote down his main skills at home.' },
      { prompt: 'What made the difference according to Kareem?', options: ['Luck', 'Preparation', 'His age', 'His salary request'], answerIndex: 1, explanation: 'He said "Preparation made the difference".' },
    ],
  },
  {
    slug: 'the-research-paper',
    title: 'The Research Paper',
    titleAr: 'ورقة البحث',
    level: 'b2',
    coverEmoji: '📄',
    summary: 'A student learns to structure an argument and cite sources carefully.',
    body: `Layla had spent three weeks working on her research paper about renewable energy. She had collected many sources, but her argument felt fragmented.

Her supervisor read the first draft and frowned. "Your evidence is strong," he said, "but the reader cannot see how the parts connect."

Layla realised the problem. She had listed facts without explaining their consequences.

She rewrote the introduction to state a clear hypothesis. She grouped the evidence into three coherent sections, and she added a paragraph that anticipated the main objection.

This time the supervisor was satisfied. "Now the argument is compelling," he said. "You have addressed the nuance, not just the surface."

Layla learned that a good paper is not a list of facts, but a careful line of reasoning.`,
    questions: [
      { prompt: 'What was the topic of Layla\'s paper?', options: ['Ancient history', 'Renewable energy', 'Modern art', 'Sports science'], answerIndex: 1, explanation: 'Her paper was about renewable energy.' },
      { prompt: 'What was wrong with the first draft?', options: ['It was too short', 'The parts did not connect', 'It had no title', 'It used no sources'], answerIndex: 1, explanation: 'The reader could not see how the parts connected.' },
      { prompt: 'What did Layla add to strengthen her argument?', options: ['A list of facts', 'A paragraph anticipating the main objection', 'More pictures', 'A shorter conclusion'], answerIndex: 1, explanation: 'She anticipated the main objection.' },
    ],
  },
  {
    slug: 'city-or-countryside',
    title: 'City or Countryside?',
    titleAr: 'المدينة أم الريف؟',
    level: 'b2',
    coverEmoji: '🏙️',
    summary: 'Two friends debate where it is better to live.',
    body: `Samir and Nadia had been friends since university, but they disagreed about almost everything. Tonight the argument was simple: is it better to live in the city or the countryside?

"The city gives you opportunities," said Samir. "Better jobs, better hospitals, and something new every evening."

Nadia shook her head. "Opportunities are useless if you are exhausted. In the countryside I breathe clean air, and I know my neighbours."

"True," Samir admitted, "but you depend on a car for everything. And quiet can become lonely."

Nadia conceded that point. "Perhaps the ideal is somewhere in between — a small town near a big city."

They laughed. For once, they agreed.`,
    questions: [
      { prompt: 'What was the argument about?', options: ['Money', 'Where to live', 'A football match', 'A university course'], answerIndex: 1, explanation: 'They debated city versus countryside living.' },
      { prompt: 'Which advantage did Nadia mention?', options: ['Better jobs', 'Clean air', 'More hospitals', 'Nightlife'], answerIndex: 1, explanation: 'She mentions breathing clean air.' },
      { prompt: 'How did the argument end?', options: ['They stopped talking', 'They agreed on a middle option', 'Samir moved away', 'Nadia won the bet'], answerIndex: 1, explanation: 'They agreed a small town near a city might be ideal.' },
    ],
  },
  {
    slug: 'the-debate',
    title: 'The Debate',
    titleAr: 'المناظرة',
    level: 'c1',
    coverEmoji: '🎙️',
    summary: 'A university debater learns the value of conceding a point to win an argument.',
    body: `When Rami reached the final of the national debate competition, he was confident. His arguments were precise and his evidence was extensive.

The motion was that technology had made people less creative. Rami had to oppose it.

His opponent opened with a compelling claim: endless access to existing content discourages original thought.

Rami could have dismissed it. Instead, he paused and conceded the nuance. "My opponent is right that passive consumption can dull creativity," he said. "But access also removes barriers. The question is not whether technology is neutral, but how we choose to use it."

The room fell silent. By granting the strongest point of his opponent, he made his own case seem impartial and rigorous.

He won the debate — not by denying the other side, but by understanding it.

"Never be afraid to concede what is true," his coach used to say. "That is where persuasion begins."`,
    questions: [
      { prompt: 'What was the motion of the debate?', options: ['Technology improves education', 'Technology made people less creative', 'Cities are better than villages', 'Exams are unnecessary'], answerIndex: 1, explanation: 'The motion stated technology made people less creative.' },
      { prompt: 'What did Rami do with his opponent\'s strongest point?', options: ['He ignored it', 'He conceded its nuance', 'He mocked it', 'He repeated his own claim'], answerIndex: 1, explanation: 'He conceded the nuance to strengthen his case.' },
      { prompt: 'Why did conceding help Rami?', options: ['It made him seem impartial and rigorous', 'It confused the judges', 'It shortened the debate', 'It made his opponent angry'], answerIndex: 0, explanation: 'Admitting a true point made his own case seem fair.' },
    ],
  },
  {
    slug: 'a-matter-of-principle',
    title: 'A Matter of Principle',
    titleAr: 'مسألة مبدأ',
    level: 'c1',
    coverEmoji: '⚖️',
    summary: 'An engineer faces a profitable but unethical request.',
    body: `For ten years, Yusuf had been a meticulous engineer. His company trusted him because he never signed off on a calculation he could not defend.

One afternoon, a senior manager asked him to approve a design that reduced safety margins to cut costs. The savings would be substantial, the manager said, and the risk was "theoretical".

Yusuf scrutinised the numbers. The risk was small, but it was real, and it would fall on people who had no voice in the decision.

He refused. The manager warned that his reluctance could harm his career.

Yusuf went home uneasy. Two weeks later, an independent review confirmed his analysis and the design was changed.

The manager never apologised, but the company promoted Yusuf to lead its safety board.

"Integrity is not a slogan," Yusuf told his team. "It is the small, inconvenient choices you make when nobody is watching."`,
    questions: [
      { prompt: 'What did the manager ask Yusuf to do?', options: ['Approve an unsafe design to cut costs', 'Resign from his job', 'Work overtime', 'Lead a new project'], answerIndex: 0, explanation: 'He wanted approval of a design with reduced safety margins.' },
      { prompt: 'How did Yusuf respond?', options: ['He agreed immediately', 'He refused', 'He delegated the decision', 'He left the company'], answerIndex: 1, explanation: 'He refused to approve the design.' },
      { prompt: 'What happened two weeks later?', options: ['Yusuf was fired', 'A review confirmed his analysis', 'The manager apologised', 'Nothing changed'], answerIndex: 1, explanation: 'An independent review confirmed his analysis.' },
    ],
  },
];

export const SEED_QUIZZES: SeedQuiz[] = [
  {
    slug: 'foundations-basics',
    title: 'Foundations Basics',
    titleAr: 'أساسيات المستوى التأسيسي',
    description: 'Greetings, introductions and the verb "to be" in everyday sentences.',
    level: 'foundation',
    courseSlug: 'english-foundations',
    lessonSlug: 'greetings-and-introductions',
    questions: [
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'Which greeting is the most formal?',
        options: ['Hi!', 'Good morning', 'Hey', "What's up?"],
        answerIndex: 1,
        points: 1,
        explanation: '"Good morning" is used in formal situations.',
      },
      {
        type: 'TRUE_FALSE',
        prompt: 'You can reply to "Nice to meet you" with "Nice to meet you too."',
        correctBoolean: true,
        points: 1,
        explanation: 'That is the polite, standard reply.',
      },
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'She ___ my sister.',
        options: ['am', 'is', 'are', 'be'],
        answerIndex: 1,
        points: 1,
        explanation: 'With he/she/it we use "is".',
      },
      {
        type: 'FILL_BLANK',
        prompt: 'Complete: I ___ ready. (use the verb "to be")',
        acceptedAnswers: ['am'],
        points: 1,
        explanation: 'With "I" we use "am".',
      },
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'Choose the correct negative: I ___ tired.',
        options: ['am not', "don't am", 'not am', 'am no'],
        answerIndex: 0,
        points: 1,
        explanation: 'The negative of "I am" is "I am not".',
      },
    ],
  },
  {
    slug: 'verb-to-be-practice',
    title: 'The verb "to be" practice',
    titleAr: 'تدريب على فعل الكينونة',
    description: 'Build confidence with am / is / are.',
    level: 'foundation',
    courseSlug: 'english-foundations',
    lessonSlug: 'the-verb-to-be',
    questions: [
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'They ___ from Canada.',
        options: ['is', 'are', 'am', 'be'],
        answerIndex: 1,
        points: 1,
        explanation: 'With you/we/they we use "are".',
      },
      {
        type: 'FILL_BLANK',
        prompt: 'Complete: He ___ a doctor.',
        acceptedAnswers: ['is'],
        points: 1,
        explanation: 'With he/she/it we use "is".',
      },
      {
        type: 'TRUE_FALSE',
        prompt: 'The correct question form is "Are you tired?".',
        correctBoolean: true,
        points: 1,
        explanation: 'To ask a question we put the verb first.',
      },
      {
        type: 'MULTIPLE_CHOICE',
        prompt: '___ she your friend?',
        options: ['Is', 'Are', 'Am', 'Be'],
        answerIndex: 0,
        points: 1,
        explanation: 'With "she" the question starts with "Is".',
      },
    ],
  },
  {
    slug: 'daily-conversation-quiz',
    title: 'Daily Conversation Quiz',
    titleAr: 'اختبار المحادثة اليومية',
    description: 'Shopping, ordering food and asking for directions.',
    level: 'a2',
    courseSlug: 'daily-conversation',
    lessonSlug: 'shopping-for-groceries',
    questions: [
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'How do you ask for the price of an item?',
        options: ['How much is this?', 'How many is this?', 'What price you?', 'How cost?'],
        answerIndex: 0,
        points: 1,
        explanation: 'For price we use "How much is this?".',
      },
      {
        type: 'FILL_BLANK',
        prompt: 'Complete: Go ___ ahead. (meaning: without turning)',
        acceptedAnswers: ['straight'],
        points: 1,
        explanation: 'We say "Go straight ahead."',
      },
      {
        type: 'TRUE_FALSE',
        prompt: 'You can order with "I\'ll have the grilled chicken, please."',
        correctBoolean: true,
        points: 1,
        explanation: 'That is a polite way to order.',
      },
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'The bank is on your ___.',
        options: ['left', 'receipt', 'menu', 'order'],
        answerIndex: 0,
        points: 1,
        explanation: 'Directions use "left" or "right".',
      },
    ],
  },
  {
    slug: 'workplace-english-quiz',
    title: 'Workplace English Quiz',
    titleAr: 'اختبار إنجليزية العمل',
    description: 'Professional emails and useful business phrases.',
    level: 'b1',
    courseSlug: 'workplace-english',
    lessonSlug: 'writing-a-professional-email',
    questions: [
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'Which is the most professional email closing?',
        options: ['Best regards,', 'Bye', 'See ya', 'Later'],
        answerIndex: 0,
        points: 1,
        explanation: '"Best regards" is a standard professional closing.',
      },
      {
        type: 'FILL_BLANK',
        prompt: 'Complete the phrase: Please find ___. (a document is included)',
        acceptedAnswers: ['attached'],
        points: 1,
        explanation: 'The phrase is "Please find attached".',
      },
      {
        type: 'TRUE_FALSE',
        prompt: 'A good email subject line should be short and specific.',
        correctBoolean: true,
        points: 1,
        explanation: 'Clear subjects help the reader.',
      },
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'What does "to follow up" mean?',
        options: [
          'To check progress later',
          'To cancel a meeting',
          'To delete a file',
          'To attach a document',
        ],
        answerIndex: 0,
        points: 1,
        explanation: '"Follow up" means to check on something later.',
      },
    ],
  },
];
