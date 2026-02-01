const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const multer = require('multer');
const path = require('path');

// ============================================
// Configuration & Initialization
// ============================================

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
let db = null;
let bucket = null;
let auth = null;
let isFirebaseInitialized = false;

try {
  let serviceAccount;
  try {
    serviceAccount = require('./firebase-service-account.json');
  } catch (err) {
    // If the JSON file is missing or invalid, attempt to build credentials from env vars
    let privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY || '';
    let privateKey = '';

    // If the key already contains BEGIN header, use as-is (may include escaped newlines)
    if (privateKeyRaw.includes('-----BEGIN')) {
      privateKey = privateKeyRaw.includes('\\n') ? privateKeyRaw.replace(/\\n/g, '\n') : privateKeyRaw;
    } else if (privateKeyRaw) {
      // Try replacing escaped newlines first
      const replaced = privateKeyRaw.replace(/\\n/g, '\n');
      if (replaced.includes('-----BEGIN')) {
        privateKey = replaced;
      } else {
        // Try treating the env value as base64-encoded PEM
        try {
          const decoded = Buffer.from(privateKeyRaw, 'base64').toString('utf8');
          if (decoded.includes('-----BEGIN')) {
            privateKey = decoded;
            console.log('🔐 Decoded FIREBASE_PRIVATE_KEY from base64');
          }
        } catch (e) {
          // ignore decode errors
        }
      }
    }

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      serviceAccount = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: privateKey
      };
    } else {
      // Re-throw original error to be handled by outer catch
      throw err;
    }
  }
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'your-bucket.appspot.com'
    });
  } catch (initErr) {
    // Provide a clearer diagnostic message while avoiding printing secrets
    const keyPreview = (serviceAccount && serviceAccount.private_key)
      ? (`[PRIVATE_KEY length=${serviceAccount.private_key.length}]`)
      : '[no private_key]';
    throw new Error(`Firebase credential parse failed. ${keyPreview} (${initErr.message})`);
  }
  db = admin.firestore();
  bucket = admin.storage().bucket();
  auth = admin.auth();
  isFirebaseInitialized = true;
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.warn('⚠️  Firebase initialization failed:', error.message);
  console.warn('⚠️  Server will run in DEMO MODE without Firebase');
  // Create a mock db object for demo mode with sample data

  // --- MOCK DATA SEEDING ---

  // Hash for 'password123'
  const knownPasswordHash = '$2b$10$ikAPH7li9DWyrkj9AYqXI.zQp81NhUvEOH0h9d1gVyqVLUTe81jLu';

  const sampleUsers = [
    {
      id: 'user_admin',
      name: 'System Admin',
      email: 'admin@example.com',
      phone: '+0000000000',
      password: knownPasswordHash,
      role: 'admin',
      trustScore: 100,
      createdAt: '2023-01-01T00:00:00.000Z',
      isActive: true
    },
    {
      id: 'user_demo_1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1234567890',
      password: knownPasswordHash,
      role: 'user',
      trustScore: 95,
      itemsReported: 5,
      itemsRecovered: 3,
      createdAt: '2024-01-01T00:00:00.000Z',
      isActive: true
    },
    {
      id: 'user_demo_2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      phone: '+1234567891',
      password: knownPasswordHash,
      role: 'user',
      trustScore: 88,
      itemsReported: 2,
      itemsRecovered: 0,
      createdAt: '2024-01-02T00:00:00.000Z',
      isActive: true
    },
    {
      id: 'user_demo_3',
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      phone: '+1234567892',
      password: knownPasswordHash,
      role: 'user',
      trustScore: 45, // Low score
      itemsReported: 10,
      itemsRecovered: 1,
      failedVerifications: 4,
      createdAt: '2024-02-15T00:00:00.000Z',
      isActive: true
    },
    {
      id: 'user_demo_4',
      name: 'Diana Prince',
      email: 'diana@example.com',
      phone: '+1234567893',
      password: knownPasswordHash,
      role: 'user',
      trustScore: 98,
      itemsReported: 1,
      itemsRecovered: 1,
      createdAt: '2024-03-10T00:00:00.000Z',
      isActive: true
    }
  ];

  const sampleItems = [
    // Alice's lost wallet
    {
      id: 'lost_demo_1',
      userId: 'user_demo_1',
      itemName: 'Black Leather Wallet',
      category: 'wallet',
      description: 'Black leather wallet containing credit cards, ID, and some cash',
      location: 'Downtown Coffee Shop',
      lostDate: '2024-01-15',
      lostTime: '09:30',
      status: 'recovered', // Recovered!
      color: 'black',
      brand: 'Gucci',
      createdAt: '2024-01-15T09:30:00.000Z',
      recoveredAt: '2024-01-16T14:00:00.000Z',
      handoverId: 'handover_demo_1'
    },
    // Bob found a wallet
    {
      id: 'found_demo_1',
      userId: 'user_demo_2',
      itemName: 'Black Wallet',
      category: 'wallet',
      description: 'Found a black leather wallet on the ground near the entrance',
      foundLocation: 'Downtown Coffee Shop',
      foundDate: '2024-01-15',
      foundTime: '10:15',
      status: 'handed_over', // Recovered!
      color: 'black',
      brand: 'Unknown',
      createdAt: '2024-01-15T10:15:00.000Z',
      handoverId: 'handover_demo_1'
    },
    // Alice's lost phone
    {
      id: 'lost_demo_2',
      userId: 'user_demo_1',
      itemName: 'Silver iPhone 12',
      category: 'phone',
      description: 'Silver iPhone 12 with a black case. Has a small crack on the screen',
      location: 'Central Park',
      lostDate: '2024-01-14',
      lostTime: '14:20',
      status: 'lost',
      color: 'silver',
      brand: 'Apple',
      createdAt: '2024-01-14T14:20:00.000Z'
    },
    // Finder for phone (Pending match)
    {
      id: 'found_demo_2',
      userId: 'user_demo_4',
      itemName: 'Silver Phone',
      category: 'phone',
      description: 'Found a silver phone in the park. Has a protective case',
      foundLocation: 'Central Park',
      foundDate: '2024-01-14',
      foundTime: '15:00',
      status: 'found',
      color: 'silver',
      brand: 'Unknown',
      createdAt: '2024-01-14T15:00:00.000Z'
    },
    // Charlie's dubious report
    {
      id: 'lost_demo_3',
      userId: 'user_demo_3',
      itemName: 'Gold Rolex',
      category: 'watch',
      description: 'Very expensive gold watch',
      location: 'Times Square',
      lostDate: '2024-02-20',
      status: 'lost',
      createdAt: '2024-02-20T10:00:00.000Z'
    }
  ];

  const sampleClaims = [
    {
      id: 'claim_demo_1',
      lostItemId: 'lost_demo_1',
      foundItemId: 'found_demo_1',
      claimerUserId: 'user_demo_1',
      finderUserId: 'user_demo_2',
      status: 'completed',
      verificationScore: 100,
      verified: true,
      createdAt: '2024-01-15T12:00:00.000Z',
      completedAt: '2024-01-16T14:00:00.000Z'
    },
    {
      id: 'claim_demo_2',
      lostItemId: 'lost_demo_2',
      foundItemId: 'found_demo_2',
      claimerUserId: 'user_demo_1',
      finderUserId: 'user_demo_4',
      status: 'pending', // Pending admin approval
      createdAt: '2024-01-14T16:00:00.000Z'
    }
  ];

  const sampleMatches = [
    {
      id: 'match_demo_1',
      lostItemId: 'lost_demo_1',
      foundItemId: 'found_demo_1',
      score: 95,
      status: 'completed'
    },
    {
      id: 'match_demo_2',
      lostItemId: 'lost_demo_2',
      foundItemId: 'found_demo_2',
      score: 88,
      status: 'pending'
    }
  ];

  const sampleHandovers = [
    {
      id: 'handover_demo_1',
      claimId: 'claim_demo_1',
      lostItemId: 'lost_demo_1',
      foundItemId: 'found_demo_1',
      claimerUserId: 'user_demo_1',
      finderUserId: 'user_demo_2',
      otp: '123456',
      status: 'completed',
      location: 'Admin Office',
      createdAt: '2024-01-16T13:00:00.000Z',
      completedAt: '2024-01-16T14:00:00.000Z'
    }
  ];

  // Helper factory for mock collections
  const createMockCollection = (dataArray, name) => ({
    add: async (data) => {
      const newItem = { id: `demo-${name}-${Date.now()}`, ...data };
      dataArray.push(newItem);
      return { id: newItem.id };
    },
    doc: (id) => ({
      get: async () => {
        const item = dataArray.find(i => i.id === id);
        return { exists: !!item, data: () => item };
      },
      set: async (data) => {
        const idx = dataArray.findIndex(i => i.id === id);
        if (idx >= 0) dataArray[idx] = { ...dataArray[idx], ...data };
        else dataArray.push({ id, ...data });
      },
      update: async (data) => {
        const idx = dataArray.findIndex(i => i.id === id);
        if (idx >= 0) dataArray[idx] = { ...dataArray[idx], ...data };
      },
      delete: async () => {
        const idx = dataArray.findIndex(i => i.id === id);
        if (idx >= 0) dataArray.splice(idx, 1);
      }
    }),
    where: (field, op, value) => ({
      get: async () => {
        const docs = dataArray.filter(i => i[field] === value).map(i => ({ id: i.id, data: () => i }));
        return { empty: docs.length === 0, docs };
      },
      orderBy: () => ({ get: async () => ({ docs: dataArray.map(i => ({ id: i.id, data: () => i })) }) })
    }),
    orderBy: () => ({
      get: async () => ({ docs: dataArray.map(i => ({ id: i.id, data: () => i })) }),
      limit: () => ({ get: async () => ({ docs: dataArray.slice(0, 100).map(i => ({ id: i.id, data: () => i })) }) })
    }),
    get: async () => ({ docs: dataArray.map(i => ({ id: i.id, data: () => i })) })
  });

  db = {
    collection: (collectionName) => {
      switch (collectionName) {
        case 'Users': return createMockCollection(sampleUsers, 'user');
        case 'items': // Legacy internal use if any
        case 'LostItems': return createMockCollection(sampleItems.filter(i => i.id.startsWith('lost') || i.status === 'lost' || i.status === 'recovered'), 'lost');
        case 'FoundItems': return createMockCollection(sampleItems.filter(i => i.id.startsWith('found') || i.status === 'found' || i.status === 'handed_over'), 'found');
        case 'claims': return createMockCollection(sampleClaims, 'claim');
        case 'Matches': return createMockCollection(sampleMatches, 'match');
        case 'handovers':
        case 'Handovers': return createMockCollection(sampleHandovers, 'handover');
        case 'audit_logs': return createMockCollection([], 'audit');
        default: return createMockCollection([], 'generic');
      }
    }
  };
  bucket = {
    file: () => ({
      save: async () => { },
      delete: async () => { },
      publicUrl: () => 'https://placehold.co/600x400'
    })
  };
}

// ============================================
// Express App Setup
// ============================================

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration
// FRONTEND_ORIGINS can be a comma-separated list of allowed origins (e.g. "http://localhost:5173,http://localhost:5174")
const rawOrigins = process.env.FRONTEND_ORIGINS || process.env.FRONTEND_URL || '';
const defaultOrigins = ['http://localhost:5173', 'http://localhost:5174'];
const allowedOrigins = rawOrigins
  ? rawOrigins.split(',').map(s => s.trim()).filter(Boolean)
  : defaultOrigins;
console.log('Allowed CORS origins:', allowedOrigins);
app.use(cors({
  origin: function (origin, callback) {
    // If no origin (e.g. server-to-server or curl), allow it
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn('Blocked CORS origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// Multer Configuration
// ============================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow image files only
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed!'), false);
    }
  }
});

// Make upload middleware globally available
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// ============================================
// Middleware
// ============================================

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Make db, bucket, auth available to routes
app.use((req, res, next) => {
  req.db = db;
  req.bucket = bucket;
  req.auth = auth;
  req.isFirebaseInitialized = isFirebaseInitialized;
  next();
});

// ============================================
// Import Routes
// ============================================

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const matchRoutes = require('./routes/matches');
const handoverRoutes = require('./routes/handovers');
const adminRoutes = require('./routes/admin');

// ============================================
// Route Mounting
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Lost&Found AI+ Backend is running',
    firebaseInitialized: isFirebaseInitialized,
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/handovers', handoverRoutes);
app.use('/api/admin', adminRoutes);

// ============================================
// Error Handling Middleware
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 5MB'
      });
    }
  }

  // Custom error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// Server Startup
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 Lost&Found AI+ Backend running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🔥 Firebase initialized: ${isFirebaseInitialized ? '✅' : '❌'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { db, bucket, upload };
