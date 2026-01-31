// Sample data for Lost&Found AI+ Firestore collections
// Run this script to populate your database with test data

const admin = require('firebase-admin');

// Initialize Firebase Admin (make sure firebase-service-account.json exists)
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Sample Users
const sampleUsers = [
  {
    name: "Alice Johnson",
    email: "alice@example.com",
    phone: "+1234567890",
    trust_score: 95,
    role: "user"
  },
  {
    name: "Bob Smith",
    email: "bob@example.com",
    phone: "+1234567891",
    trust_score: 88,
    role: "user"
  },
  {
    name: "Admin User",
    email: "admin@lostfound.com",
    phone: "+1234567899",
    trust_score: 100,
    role: "admin"
  }
];

// Sample Lost Items
const sampleLostItems = [
  {
    name: "Black Leather Wallet",
    category: "wallet",
    description: "Black leather wallet containing credit cards, ID, and some cash. Found near the coffee shop.",
    location: "Downtown Coffee Shop",
    time: "2024-01-15T09:30:00Z",
    user_id: "user1", // Will be replaced with actual user ID
    status: "lost",
    verification_answers: ["black", "3", "visa"] // Color, compartments, brand
  },
  {
    name: "Silver iPhone 12",
    category: "phone",
    description: "Silver iPhone 12 with a black case. Has a small crack on the screen.",
    location: "Central Park",
    time: "2024-01-14T14:20:00Z",
    user_id: "user1",
    status: "lost",
    verification_answers: ["black", "small crack", "apple"]
  },
  {
    name: "Blue Backpack",
    category: "bag",
    description: "Blue Nike backpack with laptop compartment. Contains school books.",
    location: "University Library",
    time: "2024-01-13T16:45:00Z",
    user_id: "user2",
    status: "lost",
    verification_answers: ["blue", "2", "nike"]
  }
];

// Sample Found Items
const sampleFoundItems = [
  {
    name: "Black Wallet",
    category: "wallet",
    description: "Found a black leather wallet on the ground near the entrance.",
    location: "Downtown Coffee Shop",
    time: "2024-01-15T10:15:00Z",
    finder_id: "user2",
    status: "found"
  },
  {
    name: "Silver Phone",
    category: "phone",
    description: "Found a silver phone in the park. Has a protective case.",
    location: "Central Park",
    time: "2024-01-14T15:00:00Z",
    finder_id: "user2",
    status: "found"
  },
  {
    name: "Blue Backpack",
    category: "bag",
    description: "Found a blue backpack left on a bench in the library.",
    location: "University Library",
    time: "2024-01-13T17:30:00Z",
    finder_id: "user1",
    status: "found"
  }
];

// Function to populate database
async function populateDatabase() {
  try {
    console.log('Starting database population...');

    // Add users
    console.log('Adding users...');
    const userRefs = [];
    for (const user of sampleUsers) {
      const userRef = await db.collection('Users').add({
        ...user,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      userRefs.push(userRef.id);
      console.log(`Added user: ${user.name}`);
    }

    // Update lost items with actual user IDs
    sampleLostItems[0].user_id = userRefs[0];
    sampleLostItems[1].user_id = userRefs[0];
    sampleLostItems[2].user_id = userRefs[1];

    // Update found items with actual user IDs
    sampleFoundItems[0].finder_id = userRefs[1];
    sampleFoundItems[1].finder_id = userRefs[1];
    sampleFoundItems[2].finder_id = userRefs[0];

    // Add lost items
    console.log('Adding lost items...');
    const lostItemRefs = [];
    for (const item of sampleLostItems) {
      const itemRef = await db.collection('LostItems').add({
        ...item,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      lostItemRefs.push(itemRef.id);
      console.log(`Added lost item: ${item.name}`);
    }

    // Add found items
    console.log('Adding found items...');
    const foundItemRefs = [];
    for (const item of sampleFoundItems) {
      const itemRef = await db.collection('FoundItems').add({
        ...item,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      foundItemRefs.push(itemRef.id);
      console.log(`Added found item: ${item.name}`);
    }

    // Create some matches
    console.log('Creating matches...');
    const matches = [
      {
        lost_item_id: lostItemRefs[0],
        found_item_id: foundItemRefs[0],
        match_score: 85,
        score_breakdown: {
          textSimilarity: 90,
          locationMatch: 100,
          timeRelevance: 50,
          imageSimilarity: 0
        }
      },
      {
        lost_item_id: lostItemRefs[1],
        found_item_id: foundItemRefs[1],
        match_score: 78,
        score_breakdown: {
          textSimilarity: 80,
          locationMatch: 100,
          timeRelevance: 40,
          imageSimilarity: 0
        }
      },
      {
        lost_item_id: lostItemRefs[2],
        found_item_id: foundItemRefs[2],
        match_score: 92,
        score_breakdown: {
          textSimilarity: 95,
          locationMatch: 100,
          timeRelevance: 75,
          imageSimilarity: 0
        }
      }
    ];

    for (const match of matches) {
      await db.collection('Matches').add({
        ...match,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Created match between lost item ${match.lost_item_id} and found item ${match.found_item_id}`);
    }

    // Create a sample handover
    console.log('Creating sample handover...');
    await db.collection('Handovers').add({
      item_id: lostItemRefs[0],
      owner_id: userRefs[0],
      finder_id: userRefs[1],
      otp: "123456",
      status: "pending",
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Database population completed successfully!');
    console.log('\nSample data created:');
    console.log(`- ${sampleUsers.length} users`);
    console.log(`- ${sampleLostItems.length} lost items`);
    console.log(`- ${sampleFoundItems.length} found items`);
    console.log(`- ${matches.length} matches`);
    console.log('- 1 handover');

  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    process.exit();
  }
}

// Run the population script
if (require.main === module) {
  populateDatabase();
}

module.exports = { populateDatabase };
