require('dotenv').config();
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

async function seedQuizzes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    // Find admin user to set as creator
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('Admin user not found. Please run adminSeeder.js first.');
      process.exit(1);
    }

    // Delete existing quizzes first
    await Quiz.deleteMany({ 
      title: { 
        $in: [
          'Driftstøtte VG2 IT - Nettverk og Sikkerhet',
          'Brukerstøtte VG2 IT - Support og Veiledning',
          'Utvikling VG2 IT - Programmering og Databaser'
        ]
      }
    });

    const quizzes = [
      {
        title: 'Driftstøtte VG2 IT - Nettverk og Sikkerhet',
        description: 'Test din kunnskap om nettverksarkitektur, sikkerhet og drifting av IT-systemer.',
        category: 'driftstøtte',
        creator: admin._id,
        isPublished: true,
        questions: [
          {
            questionText: 'Hvilke av følgende er essensielle komponenter i en driftsarkitektur?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Servere, nettverksutstyr og klienter', isCorrect: true },
              { text: 'Bare servere og klienter', isCorrect: false },
              { text: 'Kun trådløst nettverk', isCorrect: false },
              { text: 'Bare klienter', isCorrect: false }
            ],
            points: 2
          },
          {
            questionText: 'Hva er hensikten med nettverkssegmentering?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Øke nettverkshastigheten', isCorrect: false },
              { text: 'Forbedre sikkerhet og kontroll over nettverkstrafikk', isCorrect: true },
              { text: 'Spare strøm', isCorrect: false },
              { text: 'Redusere antall brukere', isCorrect: false }
            ],
            points: 2
          },
          {
            questionText: 'Hvilken påstand om skytjenester er IKKE korrekt?',
            questionType: 'multiple-choice',
            options: [
              { text: 'De tilbyr fleksibel skalering', isCorrect: false },
              { text: 'De krever ingen internettforbindelse', isCorrect: true },
              { text: 'De har ofte pay-as-you-go modell', isCorrect: false },
              { text: 'De kan redusere hardware-kostnader', isCorrect: false }
            ],
            points: 2
          },
          {
            questionText: 'Hva er en typisk sikkerhetsrisiko i moderne nettverk?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Phishing-angrep', isCorrect: true },
              { text: 'For mange backups', isCorrect: false },
              { text: 'For sterke passord', isCorrect: false },
              { text: 'For mye kryptering', isCorrect: false }
            ],
            points: 2
          },
          {
            questionText: 'Hvorfor er automatisering viktig i IT-drift?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Reduserer menneskelige feil og øker effektivitet', isCorrect: true },
              { text: 'Gjør arbeidet mer komplisert', isCorrect: false },
              { text: 'Øker kostnader', isCorrect: false },
              { text: 'Reduserer sikkerhet', isCorrect: false }
            ],
            points: 2
          }
        ]
      },
      {
        title: 'Brukerstøtte VG2 IT - Support og Veiledning',
        description: 'Test dine kunnskaper om brukerstøtte, kommunikasjon og kundeservice i IT-bransjen.',
        category: 'brukerstøtte',
        creator: admin._id,
        isPublished: true,
        questions: [
          {
            questionText: 'Hvilken kommunikasjonsform er mest hensiktsmessig når man skal forklare komplekse tekniske problemer til en ikke-teknisk bruker?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Bruke enkelt språk og relevante analogier', isCorrect: true },
              { text: 'Bruke mest mulig tekniske termer', isCorrect: false },
              { text: 'Snakke så fort som mulig', isCorrect: false },
              { text: 'Ignorere brukerens spørsmål', isCorrect: false }
            ],
            points: 2
          },
          {
            questionText: 'Hva er første steg i en systematisk feilsøkingsprosess?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Implementere løsningen', isCorrect: false },
              { text: 'Identifisere og dokumentere problemet', isCorrect: true },
              { text: 'Reinstallere systemet', isCorrect: false },
              { text: 'Ignorere tidligere feilmeldinger', isCorrect: false }
            ],
            points: 2
          },
          {
            questionText: 'Hvilke av følgende er viktigst ved utvikling av brukerveiledninger?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Bruke mange tekniske termer', isCorrect: false },
              { text: 'Inkludere tydelige, steg-for-steg instruksjoner', isCorrect: true },
              { text: 'Gjøre dem så lange som mulig', isCorrect: false },
              { text: 'Unngå skjermbilder', isCorrect: false }
            ],
            points: 2
          },
          {
            questionText: 'Hvordan bør man håndtere en frustrert kunde?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Lytte aktivt og vise forståelse', isCorrect: true },
              { text: 'Ignorere frustrasjonen', isCorrect: false },
              { text: 'Bli frustrert tilbake', isCorrect: false },
              { text: 'Avslutte samtalen', isCorrect: false }
            ],
            points: 2
          },
          {
            questionText: 'Hvilket utsagn om samhandlingsverktøy er korrekt?',
            questionType: 'multiple-choice',
            options: [
              { text: 'De er unødvendige i moderne bedrifter', isCorrect: false },
              { text: 'De forbedrer kommunikasjon og effektivitet', isCorrect: true },
              { text: 'De bør kun brukes av IT-avdelingen', isCorrect: false },
              { text: 'De reduserer produktivitet', isCorrect: false }
            ],
            points: 2
          }
        ]
      },
      {
        title: 'Utvikling VG2 IT - Programmering og Databaser',
        description: 'Test din forståelse av programutvikling, databaser og sikker koding.',
        category: 'utvikling',
        creator: admin._id,
        isPublished: true,
        questions: [
          {
            questionText: 'Hva er viktig å vurdere når man velger programmeringsspråk for et prosjekt?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Kun språkets popularitet', isCorrect: false },
              { text: 'Prosjektets krav, teamets kompetanse og ytelse', isCorrect: true },
              { text: 'Bare hva teamet kan fra før', isCorrect: false },
              { text: 'Kun kostnad av verktøy', isCorrect: false }
            ],
            points: 2
          },
          {
            questionText: 'Hva er hovedformålet med versjonskontroll?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Gjøre koden mer komplisert', isCorrect: false },
              { text: 'Spore endringer og muliggjøre samarbeid', isCorrect: true },
              { text: 'Øke filstørrelsen', isCorrect: false },
              { text: 'Gjøre utviklingen tregere', isCorrect: false }
            ],
            points: 2
          },
          {
            questionText: 'Hva menes med "innebygget personvern" (Privacy by Design)?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Å legge til personvern etter utvikling', isCorrect: false },
              { text: 'Å inkludere personvernhensyn fra starten av utviklingen', isCorrect: true },
              { text: 'Å ignorere personvern helt', isCorrect: false },
              { text: 'Å la brukerne håndtere personvern selv', isCorrect: false }
            ],
            points: 2
          },
          {
            questionText: 'Hvilken type testing bør gjøres før en applikasjon settes i produksjon?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Bare enhetstesting', isCorrect: false },
              { text: 'Omfattende testing inkludert enhets-, integrasjons- og systemtesting', isCorrect: true },
              { text: 'Ingen testing er nødvendig', isCorrect: false },
              { text: 'Bare manuell testing', isCorrect: false }
            ],
            points: 2
          },
          {
            questionText: 'Hva er en fordel med SQL-databaser sammenlignet med NoSQL?',
            questionType: 'multiple-choice',
            options: [
              { text: 'De er alltid raskere', isCorrect: false },
              { text: 'De garanterer ACID-egenskaper', isCorrect: true },
              { text: 'De er enklere å skalere horisontalt', isCorrect: false },
              { text: 'De krever mindre lagringsplass', isCorrect: false }
            ],
            points: 2
          }
        ]
      }
    ];

    // Insert quizzes
    await Quiz.insertMany(quizzes);
    console.log('Quizzes seeded successfully!');

  } catch (error) {
    console.error('Error seeding quizzes:', error);
  } finally {
    await mongoose.connection.close();
  }
}

seedQuizzes();
