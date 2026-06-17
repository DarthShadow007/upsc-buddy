export const mockQuestions = [
  {
    id: 1,
    subject: "History",
    topic: "Ancient India",
    difficulty: "medium" as const,
    question: "Which of the following was NOT a feature of the Indus Valley Civilization?",
    options: ["Planned cities", "Iron tools", "Drainage system", "Granaries"],
    correctAnswer: 1,
    explanation: "The Indus Valley Civilization (c. 3300–1300 BCE) is known for planned cities, advanced drainage systems, and granaries. Iron tools were NOT used — they belonged to the Iron Age which came later. The IVC used bronze, copper, and stone tools.",
    year: 2023,
  },
  {
    id: 2,
    subject: "Polity",
    topic: "Constitutional Bodies",
    difficulty: "hard" as const,
    question: "Which Article of the Indian Constitution deals with the establishment of the Election Commission of India?",
    options: ["Article 315", "Article 324", "Article 280", "Article 148"],
    correctAnswer: 1,
    explanation: "Article 324 of the Indian Constitution deals with the superintendence, direction, and control of elections vested in the Election Commission of India.",
    year: 2022,
  },
  {
    id: 3,
    subject: "Geography",
    topic: "Physical Geography",
    difficulty: "easy" as const,
    question: "The Western Ghats are also known as:",
    options: ["Sahyadri", "Vindhya", "Aravallis", "Satpura"],
    correctAnswer: 0,
    explanation: "The Western Ghats are also known as Sahyadri. They run parallel to the western coast of India and are a UNESCO World Heritage Site.",
    year: 2023,
  },
  {
    id: 4,
    subject: "Economy",
    topic: "Indian Economy",
    difficulty: "medium" as const,
    question: "The concept of 'Inclusive Growth' was highlighted in which Five Year Plan of India?",
    options: ["9th Plan", "10th Plan", "11th Plan", "12th Plan"],
    correctAnswer: 2,
    explanation: "The 11th Five Year Plan (2007-2012) of India was titled 'Towards Faster and More Inclusive Growth'. It emphasized inclusive growth as a key objective.",
    year: 2021,
  },
  {
    id: 5,
    subject: "Science",
    topic: "Environmental Science",
    difficulty: "easy" as const,
    question: "Which gas is primarily responsible for the greenhouse effect?",
    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
    correctAnswer: 2,
    explanation: "Carbon Dioxide (CO₂) is the primary greenhouse gas responsible for the enhanced greenhouse effect and global warming, along with water vapor, methane, and nitrous oxide.",
    year: 2022,
  },
  {
    id: 6,
    subject: "History",
    topic: "Modern India",
    difficulty: "medium" as const,
    question: "The 'Doctrine of Lapse' was introduced by which Governor-General?",
    options: ["Lord Wellesley", "Lord Dalhousie", "Lord Cornwallis", "Lord Hastings"],
    correctAnswer: 1,
    explanation: "Lord Dalhousie introduced the Doctrine of Lapse (1848–1856), under which any princely state under British protection could be annexed if the ruler died without a natural heir.",
    year: 2020,
  },
  {
    id: 7,
    subject: "Polity",
    topic: "Fundamental Rights",
    difficulty: "easy" as const,
    question: "Right to Education is a Fundamental Right under which Article?",
    options: ["Article 19", "Article 21A", "Article 32", "Article 14"],
    correctAnswer: 1,
    explanation: "Article 21A, inserted by the 86th Constitutional Amendment Act 2002, makes Right to Education a Fundamental Right for children between 6-14 years of age.",
    year: 2023,
  },
  {
    id: 8,
    subject: "Geography",
    topic: "Indian Rivers",
    difficulty: "medium" as const,
    question: "Which river is known as the 'Sorrow of Bihar'?",
    options: ["Gandak", "Kosi", "Mahananda", "Bagmati"],
    correctAnswer: 1,
    explanation: "The Kosi River is known as the 'Sorrow of Bihar' due to its frequent and devastating floods. It changes its course frequently and has caused immense destruction over centuries.",
    year: 2021,
  },
];

export const mockVocabulary = [
  { id: 1, word: "Constitutionalism", meaning: "The principle that government authority is derived from and limited by a body of fundamental law", subject: "Polity", difficulty: "hard" as const, example: "Indian democracy is based on constitutionalism, where the Constitution is the supreme law." },
  { id: 2, word: "Secularism", meaning: "The principle of separation of state and religious institutions", subject: "Polity", difficulty: "medium" as const, example: "India follows a unique form of secularism that treats all religions equally." },
  { id: 3, word: "Federalism", meaning: "A system where power is divided between central and regional governments", subject: "Polity", difficulty: "medium" as const, example: "India's federal structure gives both Union and States their own spheres of authority." },
  { id: 4, word: "Sovereignty", meaning: "Supreme authority within a territory", subject: "Polity", difficulty: "medium" as const, example: "India is a sovereign state, free from external control in its domestic and foreign affairs." },
  { id: 5, word: "Quasi-federal", meaning: "A governmental system with both federal and unitary features", subject: "Polity", difficulty: "hard" as const, example: "India is described as quasi-federal as it has a strong central government." },
  { id: 6, word: "Monsoon", meaning: "Seasonal wind patterns that bring heavy rainfall", subject: "Geography", difficulty: "easy" as const, example: "The southwest monsoon brings 70-80% of India's annual rainfall." },
  { id: 7, word: "Alluvial", meaning: "Relating to or derived from river deposits", subject: "Geography", difficulty: "medium" as const, example: "The Indo-Gangetic Plain has fertile alluvial soil." },
  { id: 8, word: "Fiscal Deficit", meaning: "The gap between government's expenditure and revenue", subject: "Economy", difficulty: "hard" as const, example: "India's fiscal deficit target for 2023-24 is 5.9% of GDP." },
];

export const mockFlashcardDecks = [
  {
    id: 1, title: "Constitutional Articles", subject: "Polity", totalCards: 50, dueToday: 12, mastered: 28,
    cards: [
      { id: 1, front: "Article 1", back: "India, that is Bharat, shall be a Union of States", mastery: 5 },
      { id: 2, front: "Article 17", back: "Abolition of Untouchability", mastery: 4 },
      { id: 3, front: "Article 32", back: "Right to Constitutional Remedies (Heart and Soul of Constitution - Dr. Ambedkar)", mastery: 3 },
      { id: 4, front: "Article 44", back: "Uniform Civil Code (Directive Principle)", mastery: 2 },
      { id: 5, front: "Article 370", back: "Special status to Jammu & Kashmir (now abrogated)", mastery: 5 },
    ]
  },
  {
    id: 2, title: "Important Battles", subject: "History", totalCards: 40, dueToday: 8, mastered: 15,
    cards: [
      { id: 1, front: "Battle of Panipat (1st) - 1526", back: "Babur defeated Ibrahim Lodi — Founded Mughal Empire", mastery: 4 },
      { id: 2, front: "Battle of Plassey - 1757", back: "British (Clive) defeated Siraj-ud-Daulah — Beginning of British rule", mastery: 3 },
      { id: 3, front: "Battle of Buxar - 1764", back: "British defeated Mir Qasim, Shuja-ud-Daula, Shah Alam II", mastery: 2 },
      { id: 4, front: "Battle of Panipat (3rd) - 1761", back: "Ahmad Shah Abdali defeated Marathas — End of Maratha dominance", mastery: 1 },
    ]
  },
  {
    id: 3, title: "Five Year Plans", subject: "Economy", totalCards: 30, dueToday: 5, mastered: 20,
    cards: [
      { id: 1, front: "1st FYP (1951-56)", back: "Focus: Agriculture, Harrod-Domar model", mastery: 5 },
      { id: 2, front: "2nd FYP (1956-61)", back: "Focus: Heavy industries, Mahalanobis model", mastery: 4 },
      { id: 3, front: "11th FYP (2007-12)", back: "Theme: 'Towards Faster and More Inclusive Growth'", mastery: 3 },
    ]
  },
];

export const mockNotes = [
  {
    id: 1,
    title: "Indian Polity - Constitutional Framework",
    subject: "Polity",
    content: `# Constitutional Framework of India

## Preamble
The Preamble declares India to be a **Sovereign, Socialist, Secular, Democratic Republic** ensuring Justice, Liberty, Equality and Fraternity.

## Key Features
1. **Lengthiest Constitution** - Originally 395 Articles, 8 Schedules
2. **Blend of Rigidity and Flexibility** 
3. **Federal with Unitary features**
4. **Parliamentary System**

## Important Articles
- Article 12-35: Fundamental Rights
- Article 36-51: Directive Principles
- Article 51A: Fundamental Duties (42nd Amendment, 1976)`,
    tags: ["constitution", "preamble", "prelims"],
    updatedAt: "2024-01-15",
    wordCount: 245,
  },
  {
    id: 2,
    title: "Indian Geography - Physiographic Divisions",
    subject: "Geography",
    content: `# Physiographic Divisions of India

## Major Divisions
1. **The Himalayan Mountains** - Fold mountains, young
2. **The Northern Plains** - Alluvial deposits, fertile
3. **The Peninsular Plateau** - Oldest landmass, crystalline rocks
4. **The Coastal Plains** - Eastern & Western Ghats
5. **The Islands** - Andaman & Nicobar, Lakshadweep

## The Himalayas
- **Greater Himalayas (Himadri)**: Avg height 6000m
- **Lesser Himalayas (Himachal)**: 3700-4500m  
- **Outer Himalayas (Shiwaliks)**: 900-1100m`,
    tags: ["geography", "himalayas", "plains", "prelims"],
    updatedAt: "2024-01-20",
    wordCount: 198,
  },
  {
    id: 3,
    title: "Indian Economy - Planning",
    subject: "Economy",
    content: `# Economic Planning in India

## NITI Aayog
- Replaced Planning Commission on 1 Jan 2015
- CEO: Heads the organization
- Not a constitutional body

## Key Economic Terms
- **GDP**: Gross Domestic Product
- **GNP**: GDP + Net factor income from abroad
- **NDP**: GDP - Depreciation`,
    tags: ["economy", "planning", "niti-aayog"],
    updatedAt: "2024-01-22",
    wordCount: 156,
  },
];

export const mockCurrentAffairs = [
  {
    id: 1,
    title: "India's Space Mission - Chandrayaan-3",
    category: "Science & Technology",
    date: "2024-01-10",
    summary: "India's Chandrayaan-3 successfully landed near the Moon's south pole on August 23, 2023, making India the first country to do so. The mission included a lander named Vikram and a rover named Pragyan.",
    tags: ["ISRO", "Moon", "Space", "Technology"],
    isRead: true,
    isImportant: true,
  },
  {
    id: 2,
    title: "G20 Summit 2023 - India's Presidency",
    category: "International Relations",
    date: "2024-01-08",
    summary: "India hosted the G20 Summit in New Delhi in September 2023. The New Delhi Declaration was adopted unanimously. The African Union was admitted as a permanent member of G20, expanding it to G21.",
    tags: ["G20", "International", "Diplomacy"],
    isRead: false,
    isImportant: true,
  },
  {
    id: 3,
    title: "Digital India Initiatives - 2024 Update",
    category: "Governance",
    date: "2024-01-05",
    summary: "The government launched new Digital India initiatives including expansion of DigiLocker, improvements to UMANG app, and new cybersecurity framework for critical infrastructure.",
    tags: ["Digital India", "Technology", "Governance"],
    isRead: false,
    isImportant: false,
  },
  {
    id: 4,
    title: "India's Economic Growth - Q3 FY2024",
    category: "Economy",
    date: "2024-01-03",
    summary: "India's GDP growth for Q3 FY2024 came in at 8.4%, higher than expected. The strong performance was driven by manufacturing and services sectors. India remains the fastest-growing major economy.",
    tags: ["GDP", "Economy", "Growth"],
    isRead: true,
    isImportant: true,
  },
  {
    id: 5,
    title: "Semiconductor Fab Units in India",
    category: "Economy",
    date: "2023-12-28",
    summary: "Cabinet approved India's first semiconductor fabrication units under the India Semiconductor Mission. Tata Group and others will set up fabs in Gujarat and Assam, reducing import dependency.",
    tags: ["Semiconductor", "Manufacturing", "Economy"],
    isRead: false,
    isImportant: false,
  },
];

export const mockProgress = {
  overall: {
    questionsAttempted: 342,
    correctAnswers: 248,
    accuracy: 72.5,
    studyHours: 156,
    currentStreak: 12,
    longestStreak: 21,
    rank: 1423,
    testsCompleted: 8,
  },
  subjectWise: [
    { subject: "Polity", attempted: 80, correct: 62, accuracy: 77.5 },
    { subject: "History", attempted: 72, correct: 51, accuracy: 70.8 },
    { subject: "Geography", attempted: 65, correct: 49, accuracy: 75.4 },
    { subject: "Economy", attempted: 58, correct: 40, accuracy: 69.0 },
    { subject: "Science", attempted: 45, correct: 31, accuracy: 68.9 },
    { subject: "Current Affairs", attempted: 22, correct: 15, accuracy: 68.2 },
  ],
  weeklyActivity: [
    { day: "Mon", questions: 25, hours: 2.5 },
    { day: "Tue", questions: 18, hours: 1.8 },
    { day: "Wed", questions: 30, hours: 3.0 },
    { day: "Thu", questions: 22, hours: 2.2 },
    { day: "Fri", questions: 15, hours: 1.5 },
    { day: "Sat", questions: 40, hours: 4.0 },
    { day: "Sun", questions: 35, hours: 3.5 },
  ],
  monthlyTrend: [
    { month: "Aug", accuracy: 58 },
    { month: "Sep", accuracy: 62 },
    { month: "Oct", accuracy: 65 },
    { month: "Nov", accuracy: 68 },
    { month: "Dec", accuracy: 71 },
    { month: "Jan", accuracy: 72.5 },
  ],
};

export const subjects = ["History", "Polity", "Geography", "Economy", "Science", "Environment", "Current Affairs", "Ethics"];
export const difficulties = ["easy", "medium", "hard"];
