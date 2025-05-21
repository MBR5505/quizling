require('dotenv').config();
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const argon2 = require('argon2');

// Quiz data
const quizzes = [
  {
    title: "Programmering og Algoritmer VG2",
    description: "Test din kunnskap om programmering, algoritmer og datastrukturer fra VG2 IT-programfaget.",
    category: "programmering",
    isPublished: true,
    questions: [
      {
        questionText: "Hvilken datastruktur følger LIFO-prinsippet (Last In, First Out)?",
        questionType: "multiple-choice",
        options: [
          { text: "Stack", isCorrect: true },
          { text: "Queue", isCorrect: false },
          { text: "Array", isCorrect: false },
          { text: "Linked List", isCorrect: false }
        ],
        points: 2
      },
      {
        questionText: "Hva er tidskompleksiteten for binærsøk i en sortert array?",
        questionType: "multiple-choice",
        options: [
          { text: "O(n)", isCorrect: false },
          { text: "O(log n)", isCorrect: true },
          { text: "O(n²)", isCorrect: false },
          { text: "O(1)", isCorrect: false }
        ],
        points: 2
      },
      {
        questionText: "Er rekursjon alltid mer effektivt enn iterasjon?",
        questionType: "true-false",
        options: [
          { text: "Sant", isCorrect: false },
          { text: "Usant", isCorrect: true }
        ],
        points: 1
      },
      {
        questionText: "Hvilken sorteringsalgoritme har en gjennomsnittlig tidskompleksitet på O(n log n)?",
        questionType: "short-answer",
        correctAnswer: "quicksort",
        points: 3
      },
      {
        questionText: "Hvilke påstander er sanne om objektorientert programmering?",
        questionType: "multiple-choice",
        options: [
          { text: "Innkapsling skjuler implementasjonsdetaljer", isCorrect: true },
          { text: "Arv tillater ikke overskrivning av metoder", isCorrect: false },
          { text: "Polymorfisme lar oss behandle objekter likt uavhengig av type", isCorrect: true },
          { text: "Private metoder kan kalles direkte fra andre klasser", isCorrect: false }
        ],
        points: 2
      }
    ]
  },
  {
    title: "Databasesystemer og Webutvikling",
    description: "Omfattende quiz om databaser, SQL, og moderne webutvikling for VG2 IT-elever.",
    category: "databaser",
    isPublished: true,
    questions: [
      {
        questionText: "Hvilken SQL-setning brukes for å kombinere rader fra to eller flere tabeller basert på en relatert kolonne?",
        questionType: "multiple-choice",
        options: [
          { text: "MERGE", isCorrect: false },
          { text: "JOIN", isCorrect: true },
          { text: "COMBINE", isCorrect: false },
          { text: "UNION", isCorrect: false }
        ],
        points: 2
      },
      {
        questionText: "Hva står API for i webutvikling?",
        questionType: "short-answer",
        correctAnswer: "Application Programming Interface",
        points: 1
      },
      {
        questionText: "Er HTTP en tilstandsløs protokoll?",
        questionType: "true-false",
        options: [
          { text: "Sant", isCorrect: true },
          { text: "Usant", isCorrect: false }
        ],
        points: 1
      },
      {
        questionText: "Hvilke normalformer er dette skjemaet i: Student(StudentID, Navn, Kurs, KursLærer)?",
        questionType: "multiple-choice",
        options: [
          { text: "Første normalform (1NF)", isCorrect: true },
          { text: "Andre normalform (2NF)", isCorrect: false },
          { text: "Tredje normalform (3NF)", isCorrect: false },
          { text: "Boyce-Codd normalform (BCNF)", isCorrect: false }
        ],
        points: 3
      },
      {
        questionText: "Hvilken type database bruker dokumentbasert lagring?",
        questionType: "short-answer",
        correctAnswer: "mongodb",
        points: 2
      }
    ]
  },
  {
    title: "Nettverk og Sikkerhet",
    description: "Test dine kunnskaper om nettverksteknologi, sikkerhet og kryptografi fra VG2 IT.",
    category: "nettverk",
    isPublished: true,
    questions: [
      {
        questionText: "Hvilken lag i OSI-modellen håndterer ruting mellom nettverk?",
        questionType: "multiple-choice",
        options: [
          { text: "Transport", isCorrect: false },
          { text: "Nettverk", isCorrect: true },
          { text: "Datalink", isCorrect: false },
          { text: "Sesjon", isCorrect: false }
        ],
        points: 2
      },
      {
        questionText: "Er HTTPS en kryptert versjon av HTTP?",
        questionType: "true-false",
        options: [
          { text: "Sant", isCorrect: true },
          { text: "Usant", isCorrect: false }
        ],
        points: 1
      },
      {
        questionText: "Hvilken hashing-algoritme bør IKKE brukes i dag på grunn av kjente sårbarheter?",
        questionType: "short-answer",
        correctAnswer: "md5",
        points: 2
      },
      {
        questionText: "Hvilke påstander om brannmurer er korrekte?",
        questionType: "multiple-choice",
        options: [
          { text: "Kan blokkere spesifikke porter", isCorrect: true },
          { text: "Beskytter bare mot utgående trafikk", isCorrect: false },
          { text: "Kan inspisere pakkeinnhold", isCorrect: true },
          { text: "Erstatter behovet for antivirus", isCorrect: false }
        ],
        points: 2
      },
      {
        questionText: "Hva er den vanligste porten for HTTPS-trafikk?",
        questionType: "short-answer",
        correctAnswer: "443",
        points: 1
      }
    ]
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Create a test user if it doesn't exist
    const testUser = await User.findOne({ email: 'teacher@test.com' });
    let userId;

    if (!testUser) {
      const hashedPassword = await argon2.hash('password123');      const newUser = await User.create({
        username: 'TestTeacher',
        email: 'teacher@test.com',
        password: hashedPassword,
        role: 'admin'  // Changed from 'teacher' to 'admin' to match User model
      });
      userId = newUser._id;
      console.log('Created test user');
    } else {
      userId = testUser._id;
      console.log('Using existing test user');
    }

    // Delete existing quizzes
    await Quiz.deleteMany({});
    console.log('Cleared existing quizzes');

    // Add creator to each quiz and save
    const quizzesWithCreator = quizzes.map(quiz => ({
      ...quiz,
      creator: userId
    }));

    await Quiz.insertMany(quizzesWithCreator);
    console.log('Successfully seeded quizzes');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();
