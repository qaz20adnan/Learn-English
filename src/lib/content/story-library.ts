import type { SeedStory } from './seed-data';

/**
 * Additional graded stories. Kept separate from the original seed file so the
 * library can grow without turning one file into an unmaintainable document.
 * `npm run db:stories` upserts these stories by slug and refreshes their
 * comprehension questions without touching learner attempts or scores.
 */
export const STORY_LIBRARY: SeedStory[] = [
  {
    slug: 'the-blue-umbrella',
    title: 'The Blue Umbrella',
    titleAr: 'المظلة الزرقاء',
    level: 'foundation',
    coverEmoji: '☔',
    summary: 'A little girl helps a stranger on a rainy day.',
    body: `It was a rainy morning. Lina looked out of the window. The sky was grey, and the streets were wet.

Lina had a small blue umbrella. She put on her coat and walked to school.

On the corner, an old man stood under a tree. He had no umbrella. His bag was getting wet.

"Excuse me," said Lina. "You can share my umbrella."

The man smiled. "Thank you. That is very kind."

They walked together to the bus stop. The man told Lina a funny story about his cat. Lina laughed.

When the bus came, the man said, "Keep your umbrella. You are a good girl."

Lina smiled all the way to school. The rain did not feel cold anymore.`,
    questions: [
      {
        prompt: 'What was the weather like?',
        options: ['Sunny and hot', 'Rainy and grey', 'Snowy', 'Windy but dry'],
        answerIndex: 1,
        explanation: 'The story says the sky was grey and the streets were wet.',
      },
      {
        prompt: 'Who needed help?',
        options: ['A teacher', 'An old man', 'A bus driver', 'Lina’s friend'],
        answerIndex: 1,
        explanation: 'The old man had no umbrella and his bag was getting wet.',
      },
      {
        prompt: 'How did Lina help?',
        options: ['She gave him her bag', 'She shared her umbrella', 'She called a taxi', 'She bought him a coat'],
        answerIndex: 1,
        explanation: 'Lina invited the man to share her small blue umbrella.',
      },
      {
        prompt: 'Why did Lina smile at the end?',
        options: ['She found money', 'She liked the rain', 'She felt good about helping', 'She missed school'],
        answerIndex: 2,
        explanation: 'Helping the man made her feel happy and warm.',
      },
    ],
  },
  {
    slug: 'a-day-at-the-library',
    title: 'A Day at the Library',
    titleAr: 'يوم في المكتبة',
    level: 'a1',
    coverEmoji: '📚',
    summary: 'A young learner discovers that the library offers more than books.',
    body: `Yousef wanted a quiet place to study. His home was noisy because his cousins were visiting, so he went to the public library.

At the door, a librarian gave him a map. "Books are on the first floor," she said. "The study rooms are upstairs. You can also join a conversation club at four o’clock."

Yousef found a desk near a window. He studied for two hours. Then he heard people laughing in the next room. The conversation club was starting.

He felt nervous. His English was not perfect. But a woman welcomed him and said, "Mistakes are part of learning."

They talked about food, travel and favourite films. Yousef spoke slowly, but everyone listened. By the end of the hour, he had three new friends and one new idea: the library was not only a place for books.

He went home with a book under his arm and a smile on his face.`,
    questions: [
      {
        prompt: 'Why did Yousef go to the library?',
        options: ['To meet friends', 'To find a quiet place to study', 'To return a film', 'To work as a librarian'],
        answerIndex: 1,
        explanation: 'His home was noisy, so he wanted a quiet place to study.',
      },
      {
        prompt: 'Where were the study rooms?',
        options: ['On the first floor', 'Upstairs', 'Outside the library', 'In the café'],
        answerIndex: 1,
        explanation: 'The librarian said the study rooms were upstairs.',
      },
      {
        prompt: 'What happened at four o’clock?',
        options: ['The library closed', 'A conversation club started', 'A film began', 'A test took place'],
        answerIndex: 1,
        explanation: 'The librarian mentioned a conversation club at four o’clock.',
      },
      {
        prompt: 'What did Yousef learn at the end?',
        options: ['His English was perfect', 'The library was only for books', 'Mistakes are part of learning', 'He should study at home'],
        answerIndex: 2,
        explanation: 'A woman told him that mistakes are part of learning, and he experienced it.',
      },
    ],
  },
  {
    slug: 'the-missing-train-ticket',
    title: 'The Missing Train Ticket',
    titleAr: 'تذكرة القطار المفقودة',
    level: 'a2',
    coverEmoji: '🚆',
    summary: 'A traveller must solve a small problem before the train leaves.',
    body: `Maya arrived at the station with ten minutes to spare. She had bought her ticket online, but her phone battery was dead. She looked for the printed copy in her bag. It was not there.

She checked her pockets, her notebook and even her scarf. Nothing. The train was already waiting at platform six.

At the information desk, a patient clerk named Mr. Haddad listened to her problem. "Do you remember the booking number?" he asked.

Maya closed her eyes. She had written it on a small piece of paper at home. "I think it starts with the letters M and T," she said.

Mr. Haddad searched the system. "I need more than that," he said with a smile. "But I can see that a ticket was booked in your name. Show me your identity card."

Maya found her card. The clerk confirmed the booking and printed a new ticket. "You have three minutes," he said.

She ran to the platform and stepped onto the train just as the doors began to close. She sat down, breathing hard, and promised herself to keep a paper copy next time.`,
    questions: [
      {
        prompt: 'Why could Maya not show her ticket on her phone?',
        options: ['She lost the phone', 'The battery was dead', 'She had no internet', 'The screen was broken'],
        answerIndex: 1,
        explanation: 'Her phone battery was dead.',
      },
      {
        prompt: 'Who helped Maya?',
        options: ['A train driver', 'A friend', 'A clerk at the information desk', 'A passenger'],
        answerIndex: 2,
        explanation: 'Mr. Haddad at the information desk helped her.',
      },
      {
        prompt: 'What did Maya remember about the booking?',
        options: ['The full number', 'The date only', 'The first letters', 'The seat number'],
        answerIndex: 2,
        explanation: 'She remembered that the number started with M and T.',
      },
      {
        prompt: 'What lesson did Maya learn?',
        options: ['Trains are always late', 'Keep a paper copy', 'Never travel alone', 'Phones are useless'],
        answerIndex: 1,
        explanation: 'She promised herself to keep a paper copy next time.',
      },
    ],
  },
  {
    slug: 'the-volunteer-garden',
    title: 'The Volunteer Garden',
    titleAr: 'حديقة المتطوعين',
    level: 'b1',
    coverEmoji: '🌻',
    summary: 'A neighbourhood turns an empty lot into a shared garden.',
    body: `The empty lot between two buildings had been a problem for years. People threw rubbish there, and the smell kept neighbours indoors. When the city announced that the land would be used for a new car park, a small group of residents decided to propose something different.

Amal, a retired teacher, organised the first meeting. She expected six people. Thirty came. Some wanted a vegetable garden, others preferred flowers, and a few simply wanted a safe place for children to play. The discussion was lively, sometimes heated, but everyone agreed on one point: the lot should not become another car park.

They presented a plan to the local council: a community garden with shared plots, a small playground and a covered seating area. Volunteers would maintain it. The council approved a one-year trial.

The work was harder than expected. The soil was poor, and the summer was dry. Yet neighbours who had never spoken before found themselves watering plants together and sharing tools. By autumn, the garden was producing tomatoes, mint and more conversation than any of them had anticipated.

At the end of the trial, the council renewed the agreement. Amal smiled at the new sign near the gate: "Grown by neighbours."`,
    questions: [
      {
        prompt: 'What was the original plan for the empty lot?',
        options: ['A school', 'A car park', 'A shopping centre', 'A hospital'],
        answerIndex: 1,
        explanation: 'The city planned to use the land for a new car park.',
      },
      {
        prompt: 'Who organised the first meeting?',
        options: ['A council officer', 'A retired teacher', 'A shop owner', 'A child'],
        answerIndex: 1,
        explanation: 'Amal, a retired teacher, organised the meeting.',
      },
      {
        prompt: 'What unexpected benefit did the garden bring?',
        options: ['Cheaper vegetables', 'More traffic', 'New social connections', 'A larger playground'],
        answerIndex: 2,
        explanation: 'Neighbours who had never spoken began working together and talking.',
      },
      {
        prompt: 'What happened at the end of the trial?',
        options: ['The garden closed', 'The council renewed the agreement', 'The land was sold', 'The volunteers stopped'],
        answerIndex: 1,
        explanation: 'The council renewed the agreement after the successful trial.',
      },
    ],
  },
  {
    slug: 'the-small-business',
    title: 'The Small Business',
    titleAr: 'المشروع الصغير',
    level: 'b1',
    coverEmoji: '🧵',
    summary: 'A tailor learns how to grow without losing what makes his shop special.',
    body: `Karim had run his tailoring shop for twelve years. He knew most of his customers by name and remembered their measurements without checking his notebook. When a large clothing chain opened nearby, his sales fell sharply.

A friend suggested that he advertise online. Karim was sceptical. "People want cheap clothes," he said. "They do not want a tailor."

His daughter, Rana, disagreed. She photographed three of his best jackets and created a simple website. She wrote about the time he had repaired a wedding suit in one night and about his promise to adjust any purchase for free.

The first online order came from a young engineer who wanted a jacket that fitted properly. Then came a teacher, a musician and a small theatre company. Karim was soon busier than before, but he made a rule: he would not accept more orders than he could finish well.

He hired one assistant and raised his prices slightly. Some customers complained, but most understood. The chain offered speed and low prices; Karim offered attention. He had learned that growth does not always mean becoming bigger. Sometimes it means becoming clearer about what you do best.`,
    questions: [
      {
        prompt: 'Why did Karim’s sales fall?',
        options: ['He moved away', 'A large clothing chain opened nearby', 'He raised his prices', 'His shop was too small'],
        answerIndex: 1,
        explanation: 'A large clothing chain opened nearby and reduced his sales.',
      },
      {
        prompt: 'What did Rana do to help?',
        options: ['She opened a chain store', 'She created a website with his story', 'She lowered his prices', 'She closed the shop'],
        answerIndex: 1,
        explanation: 'Rana photographed jackets and created a website describing his work.',
      },
      {
        prompt: 'What rule did Karim make when business improved?',
        options: ['He stopped taking orders', 'He only accepted work he could finish well', 'He hired ten assistants', 'He moved to a new city'],
        answerIndex: 1,
        explanation: 'He refused more orders than he could complete to a high standard.',
      },
      {
        prompt: 'What is the main idea of the story?',
        options: ['Bigger is always better', 'Growth can mean being clear about your strengths', 'Online business is easy', 'Tailors cannot compete'],
        answerIndex: 1,
        explanation: 'Karim grew by focusing on quality and his unique strengths.',
      },
    ],
  },
  {
    slug: 'the-climate-project',
    title: 'The Climate Project',
    titleAr: 'مشروع المناخ',
    level: 'b2',
    coverEmoji: '🌍',
    summary: 'A student group discovers that a good idea is not enough without trust.',
    body: `The student council at Redwood College had won a small grant for a climate project. Their plan was ambitious: replace the school’s ageing heating system with solar panels and use the savings to fund a bicycle scheme. On paper, it was elegant.

The first public meeting exposed the difficulty. The maintenance staff worried that the panels would be expensive to repair. Parents asked whether the bicycle route would be safe. A group of older students argued that the money should instead be spent on sports equipment. The council members had prepared graphs, but not answers to these practical concerns.

Rather than defend the original plan, the council changed strategy. They invited the maintenance manager to join the project team, organised a safety walk along the proposed route, and published a simple budget that showed the expected savings. They also admitted that the first version of the plan had underestimated maintenance costs.

That admission surprised people. Instead of weakening the proposal, it made the council seem honest. The revised plan passed by a narrow margin, with the sports group abstaining rather than voting against it.

The panels were installed the following spring. On sunny days, a small display in the entrance shows how much energy the college is producing. The numbers are useful, but the students say the real lesson was learning how to listen before asking for a vote.`,
    questions: [
      {
        prompt: 'What was the council’s original plan?',
        options: ['Build a sports hall', 'Install solar panels and fund bicycles', 'Plant trees', 'Buy new computers'],
        answerIndex: 1,
        explanation: 'They planned solar panels and a bicycle scheme.',
      },
      {
        prompt: 'Why did the first meeting go badly?',
        options: ['The council had no budget', 'People raised practical concerns the council had not addressed', 'The staff refused to attend', 'The grant was cancelled'],
        answerIndex: 1,
        explanation: 'The council had graphs but no answers about repairs, safety and spending.',
      },
      {
        prompt: 'What did the council do differently?',
        options: ['They ignored the critics', 'They included staff and addressed concerns', 'They cancelled the project', 'They spent the money on sports'],
        answerIndex: 1,
        explanation: 'They invited the maintenance manager, checked safety and published a budget.',
      },
      {
        prompt: 'Why did admitting a mistake help the council?',
        options: ['It made the plan cheaper', 'It made them seem honest and trustworthy', 'It ended the debate', 'It convinced the sports group to vote yes'],
        answerIndex: 1,
        explanation: 'The admission increased trust, and the revised plan passed.',
      },
    ],
  },
  {
    slug: 'the-silent-witness',
    title: 'The Silent Witness',
    titleAr: 'الشاهد الصامت',
    level: 'b2',
    coverEmoji: '🕵️',
    summary: 'A careful observer notices what everyone else overlooks.',
    body: `When the painting disappeared from the town gallery, the police interviewed everyone who had been in the building. The cleaner had seen nothing. The guard had been on a short break. The curator insisted that the alarm had worked perfectly.

Detective Hana read the statements twice. One detail bothered her. The cleaner said the floor near the painting had been "unusually clean" that morning, although she had mopped it the previous evening. The guard mentioned that the security light in the east corridor had flickered. The curator said the alarm had gone off only once, at 2:14 a.m.

Hana visited the gallery after closing. She stood in the east corridor and looked at the ceiling. The camera there pointed slightly upwards, towards a ventilation grille. She asked the technician to check the footage from the night before. It showed a figure entering through the service door at 1:58, carrying a flat case. The figure did not run. They walked calmly, as if they belonged there.

The service door had been opened with the curator’s key card. When confronted, the curator claimed the card had been stolen. But the footage showed him entering the building at 1:55 and leaving the alarm room minutes later.

The painting was recovered from a storage unit two days later. Hana’s report was brief: "The most important evidence was not the alarm. It was the floor."`,
    questions: [
      {
        prompt: 'What detail about the floor caught Hana’s attention?',
        options: ['It was damaged', 'It was unusually clean', 'It was painted', 'It was covered with dust'],
        answerIndex: 1,
        explanation: 'The floor near the painting had been cleaned after the cleaner’s evening work.',
      },
      {
        prompt: 'What did the camera footage reveal?',
        options: ['The cleaner took the painting', 'A calm figure entered through the service door', 'The alarm was broken', 'The guard was asleep'],
        answerIndex: 1,
        explanation: 'A figure carrying a flat case entered calmly through the service door.',
      },
      {
        prompt: 'Why did the curator become a suspect?',
        options: ['His key card opened the service door', 'He was absent that night', 'He had bought the painting', 'He called the police'],
        answerIndex: 0,
        explanation: 'The service door was opened with the curator’s key card.',
      },
      {
        prompt: 'What is the main lesson of the story?',
        options: ['Alarms are useless', 'Small details can be the best evidence', 'Cleaners solve crimes', 'Museums are unsafe'],
        answerIndex: 1,
        explanation: 'Hana solved the case by noticing small inconsistencies.',
      },
    ],
  },
  {
    slug: 'the-ethical-algorithm',
    title: 'The Ethical Algorithm',
    titleAr: 'الخوارزمية الأخلاقية',
    level: 'c1',
    coverEmoji: '🤖',
    summary: 'An engineer must decide whether a profitable system is fair enough to release.',
    body: `The model had outperformed every previous version. It predicted which loan applicants were likely to repay, and it did so with impressive accuracy. The company’s executives were delighted. A successful launch would secure the next round of investment.

Nadia, the lead engineer, was not satisfied. During testing, she noticed that the model rejected applicants from one particular postcode far more often than equally qualified applicants from other areas. The pattern was not explicit in the data. It emerged indirectly, through a combination of employment history and address, variables that had once been used as proxies for ethnicity.

Her manager argued that the model was statistically superior and that removing the problematic variables would reduce accuracy. "We are not responsible for historical inequality," he said. "Our job is to predict repayment."

Nadia disagreed. A prediction can be accurate and still be unjust, especially when it determines whether someone can afford a home. She proposed a compromise: keep the model but test it for disparate impact, document the limitations, and allow human review for applicants near the decision boundary.

The executives resisted. A delay would cost money, and the launch date had already been announced. Nadia requested a formal review and submitted her findings in writing.

The review took six weeks. In the end, the company adopted most of her proposals. The model’s accuracy fell by two percentage points. Nadia considered that a reasonable price for a system she could defend in public.

The launch was not celebrated as a triumph. It was described, more modestly, as responsible. Nadia thought that was the right word.`,
    questions: [
      {
        prompt: 'What was the model designed to predict?',
        options: ['Which employees to hire', 'Which loan applicants would repay', 'Which products would sell', 'Which students would pass'],
        answerIndex: 1,
        explanation: 'It predicted the likelihood that loan applicants would repay.',
      },
      {
        prompt: 'What problem did Nadia discover?',
        options: ['The model was too slow', 'It rejected applicants from one postcode disproportionately', 'It was too expensive', 'It could not handle new data'],
        answerIndex: 1,
        explanation: 'The model rejected equally qualified applicants from one postcode more often.',
      },
      {
        prompt: 'What did Nadia propose?',
        options: ['Cancel the project permanently', 'Keep the model with impact testing and human review', 'Remove all address data and ignore accuracy', 'Sell the model to another company'],
        answerIndex: 1,
        explanation: 'She suggested impact testing, documentation and human review near the boundary.',
      },
      {
        prompt: 'Why did Nadia accept a small drop in accuracy?',
        options: ['She did not care about accuracy', 'She wanted a system she could defend publicly', 'The executives forced her', 'The model was already obsolete'],
        answerIndex: 1,
        explanation: 'She believed fairness was worth two percentage points of accuracy.',
      },
    ],
  },
];
