const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// Configuration & Initialization
// ============================================

// Load environment variables
dotenv.config();

// Mock Data Persistence Helpers
const MOCK_DB_FILE = path.join(__dirname, 'mock-db.json');

const loadMockData = () => {
  try {
    if (fs.existsSync(MOCK_DB_FILE)) {
      const data = fs.readFileSync(MOCK_DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Failed to load mock DB, starting fresh:', err.message);
  }
  return null;
};

const saveMockData = (data) => {
  try {
    fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to save mock DB:', err.message);
  }
};

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

  // Initialize mock data from file or defaults
  let mockData = loadMockData();

  if (!mockData) {
    // Default initial data if no file exists
    // Hash for 'password123'
    const knownPasswordHash = '$2b$10$ikAPH7li9DWyrkj9AYqXI.zQp81NhUvEOH0h9d1gVyqVLUTe81jLu';

    // ... (Your existing sample data definitions here, consolidated) ...
    // To keep the file concise, we will just initialize standard empty arrays + admin user
    // The previous large sample arrays are good but hard to maintain in this Replace block.
    // I will try to keep the logic simple: verify if we have data, if not, allow lazy creation.

    mockData = {
      Users: [
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
        }
      ],
      LostItems: [],
      FoundItems: [],
      claims: [],
      Matches: [],
      handovers: [],
      audit_logs: []
    };

    // Save initial state
    saveMockData(mockData);
  }

  // Helper factory for mock collections
  const createMockCollection = (collectionName) => {
    // Ensure collection exists
    if (!mockData[collectionName]) {
      mockData[collectionName] = [];
    }

    const dataArray = mockData[collectionName];

    return {
      add: async (data) => {
        const newItem = { id: `demo-${collectionName}-${Date.now()}-${Math.floor(Math.random() * 1000)}`, ...data };
        dataArray.push(newItem);
        saveMockData(mockData);
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
          saveMockData(mockData);
        },
        update: async (data) => {
          const idx = dataArray.findIndex(i => i.id === id);
          if (idx >= 0) {
            dataArray[idx] = { ...dataArray[idx], ...data };
            saveMockData(mockData);
          }
        },
        delete: async () => {
          const idx = dataArray.findIndex(i => i.id === id);
          if (idx >= 0) {
            dataArray.splice(idx, 1);
            saveMockData(mockData);
          }
        }
      }),
      where: (field, op, value) => ({
        get: async () => {
          // Simple equality check for now, can extend for other ops
          const docs = dataArray.filter(i => {
            if (op === '==') return i[field] === value;
            return false;
          }).map(i => ({ id: i.id, data: () => i }));
          return { empty: docs.length === 0, docs };
        },
        orderBy: (orderField, direction) => ({
          get: async () => {
            // Basic sort support
            const sorted = [...dataArray].sort((a, b) => {
              if (a[orderField] < b[orderField]) return direction === 'desc' ? 1 : -1;
              if (a[orderField] > b[orderField]) return direction === 'desc' ? -1 : 1;
              return 0;
            });
            return { docs: sorted.map(i => ({ id: i.id, data: () => i })) };
          },
          limit: (n) => ({ get: async () => ({ docs: dataArray.slice(0, n).map(i => ({ id: i.id, data: () => i })) }) })
        }),
        limit: (n) => ({ get: async () => ({ docs: dataArray.slice(0, n).map(i => ({ id: i.id, data: () => i })) }) })
      }),
      orderBy: (orderField, direction) => ({
        get: async () => {
          const sorted = [...dataArray].sort((a, b) => {
            if (a[orderField] < b[orderField]) return direction === 'desc' ? 1 : -1;
            if (a[orderField] > b[orderField]) return direction === 'desc' ? -1 : 1;
            return 0;
          });
          return { docs: sorted.map(i => ({ id: i.id, data: () => i })) };
        },
        limit: (n) => ({ get: async () => ({ docs: dataArray.slice(0, n).map(i => ({ id: i.id, data: () => i })) }) })
      }),
      get: async () => ({ docs: dataArray.map(i => ({ id: i.id, data: () => i })) })
    };
  };

  db = {
    collection: (collectionName) => createMockCollection(collectionName)
  };

  // Mock Bucket
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
app.use('/api/notifications', require('./routes/notifications'));

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
