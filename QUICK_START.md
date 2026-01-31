# Lost&Found AI+ - Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
- Node.js 16+ installed
- npm or pnpm package manager
- Firebase account with a project created
- Firebase service account JSON key

### Step 1: Clone & Install

```bash
# Navigate to project root
cd hackthon

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Configure Environment

#### Backend Configuration
```bash
# Create .env file in backend/
cd backend
cp .env.example .env

# Edit .env with your Firebase credentials:
# - FIREBASE_PROJECT_ID
# - FIREBASE_PRIVATE_KEY
# - FIREBASE_CLIENT_EMAIL
# - FIREBASE_STORAGE_BUCKET
# - JWT_SECRET (any random string)
# - PORT=5000
```

#### Frontend Configuration
```bash
# Edit .env in root directory
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start Development Servers

```bash
# Terminal 1 - Backend (from backend/)
npm run dev
# Should show: "Server is running on port 5000"

# Terminal 2 - Frontend (from root)
npm run dev
# Should show: "Local: http://localhost:5173"
```

### Step 4: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

---

## 🎯 Demo User Flow

### 1. Register a New User
```
URL: http://localhost:5173
- Click "Sign Up"
- Fill in: Name, Email, Phone, Password
- Backend: POST /api/auth/register
- Creates user with initial trust_score: 50
```

### 2. Report a Lost Item
```
- Click "Report Lost Item"
- Fill form: Name, Category, Description, Location, Time
- Upload image (optional)
- AI generates verification questions
- Submit to create LostItems document
```

### 3. Report a Found Item
```
- Click "Report Found Item"
- Similar form to lost item
- Auto-matching triggers immediately
- System searches for matching lost items
```

### 4. View Matches
```
- After reporting lost item
- System shows Top 3 matches
- Each shows match score (0-100%)
- Breakdown: Text%, Location%, Time%, Image%
```

### 5. Verify Ownership
```
- Click "Verify Ownership" on a match
- Answer 3 AI-generated questions
- System checks: 2+ correct answers = verified
- Trust score updates: +1 for success, -2 for failure
```

### 6. Secure Handover
```
- OTP generated (6-digit code, 10-min expiry)
- QR code displayed for scanning
- Both users coordinate meeting
- Hold button to confirm exchange
- Digital receipt generated
```

### 7. View Admin Dashboard
```
- Triple-click "Lost&Found AI+" logo on home screen
- Secret admin access (demo mode)
- View analytics, fraud alerts, heatmap
- Manage handovers and users
```

---

## 📱 API Quick Reference

### Authentication
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "password": "securepass123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

### Report Items
```bash
# Report Lost Item (with JWT token)
curl -X POST http://localhost:5000/api/items/report-lost \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "name=iPhone 14" \
  -F "category=phone" \
  -F "description=Blue iPhone with case" \
  -F "location=Central Park" \
  -F "time=2024-01-31T10:00:00Z" \
  -F "verification_answers=Blue" \
  -F "verification_answers=Yes" \
  -F "verification_answers=Apple" \
  -F "image=@/path/to/image.jpg"
```

### Get Matches
```bash
curl -X GET "http://localhost:5000/api/matches/match-items?lostItemId=ITEM_ID" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Verify Ownership
```bash
curl -X POST http://localhost:5000/api/handovers/verify-owner \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "MATCH_ID",
    "answers": ["Blue", "Yes", "Apple"]
  }'
```

### Generate OTP
```bash
curl -X POST http://localhost:5000/api/handovers/generate-otp \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"handoverId": "HANDOVER_ID"}'
```

---

## 🔑 Important Credentials

### Default Admin Access
- **Method**: Triple-click on logo in home screen (dev mode)
- **Dashboard**: View all analytics and controls
- **No password needed**: Development access only

### Demo Users (if using sample-data.js)
```javascript
// Run to populate with sample data:
node backend/sample-data.js

// Sample users created:
// - john@example.com / password
// - jane@example.com / password
```

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Error: Port 5000 already in use
# Solution: Change PORT in .env or kill process on port 5000

# Error: Firebase credentials not found
# Solution: 
# 1. Create .env file in backend/
# 2. Add all required Firebase credentials from .env.example
# 3. Download service account JSON from Firebase Console

# Error: Cannot find module 'firebase-admin'
# Solution:
cd backend
npm install
```

### Frontend Won't Start
```bash
# Error: VITE_API_URL not set
# Solution: Create .env in root with:
# VITE_API_URL=http://localhost:5000/api

# Error: Port 5173 already in use
# Solution: Vite will auto-increment to 5174, 5175, etc.
# Or change in package.json: "dev": "vite --port 3000"
```

### API Connection Errors
```bash
# Error: Failed to fetch /api/health
# Solution:
# 1. Check backend is running on port 5000
# 2. Check CORS is enabled (should be in server.js)
# 3. Check API_BASE_URL in frontend/src/services/api.ts

# Error: Authentication failed
# Solution:
# 1. Register/Login first
# 2. Check JWT token is saved in localStorage
# 3. Verify token hasn't expired (7 days)
```

### Database Connection Issues
```bash
# Error: Firebase credentials invalid
# Solution:
# 1. Download new service account key from Firebase Console
# 2. Copy content to backend/.env FIREBASE_PRIVATE_KEY
# 3. Restart backend server

# Error: Firestore permission denied
# Solution:
# 1. Check Firebase Security Rules are permissive in development
# 2. Use: match /{document=**} { allow read, write; }
# 3. For production, implement proper security rules
```

---

## 📊 Feature Testing Checklist

### User Registration & Auth
- [ ] Register new user successfully
- [ ] Login with correct credentials
- [ ] Receive JWT token
- [ ] Token stored in localStorage
- [ ] Logout clears token

### Lost Item Flow
- [ ] Report lost item with all fields
- [ ] Image upload works
- [ ] Verification questions generated
- [ ] Item appears in "My Lost Items"

### Found Item Flow
- [ ] Report found item
- [ ] Auto-matching triggers
- [ ] Top 3 matches displayed
- [ ] Match scores calculated correctly

### Verification Process
- [ ] Verification questions shown
- [ ] Answer questions with 2+ correct
- [ ] Trust score increases by 1
- [ ] Error message on < 2 correct
- [ ] Trust score decreases by 2

### Handover Process
- [ ] OTP generated (6 digits)
- [ ] QR code displayed
- [ ] OTP expires after 10 minutes
- [ ] Hold-to-confirm button works
- [ ] Digital receipt created

### Admin Dashboard
- [ ] Access via triple-click logo
- [ ] Dashboard loads analytics
- [ ] Stats cards show correct numbers
- [ ] Charts render properly
- [ ] Fraud alerts display
- [ ] Heatmap shows data

---

## 🎓 Code Structure

```
hackthon/
├── src/                           # Frontend React code
│   ├── app/
│   │   ├── components/            # React components
│   │   └── App.tsx               # Main app component
│   ├── services/
│   │   └── api.ts                # API client
│   ├── contexts/
│   │   └── AuthContext.tsx       # Auth management
│   └── main.tsx                   # Entry point
├── backend/                       # Node.js API server
│   ├── server.js                 # Express app
│   ├── routes/                    # API endpoints
│   │   ├── auth.js               # Auth routes
│   │   ├── items.js              # Item reporting
│   │   ├── matches.js            # AI matching
│   │   ├── handovers.js          # Handover process
│   │   └── admin.js              # Admin endpoints
│   ├── services/
│   │   └── matchingService.js    # Matching algorithm
│   └── middleware/
│       └── auth.js               # JWT verification
├── package.json                   # Frontend deps
├── backend/package.json           # Backend deps
├── README.md                      # Main documentation
└── IMPLEMENTATION_GUIDE.md        # Detailed guide
```

---

## 🚀 Deployment Preparation

### Pre-Deployment Checklist
- [ ] All environment variables configured
- [ ] Firebase rules configured for security
- [ ] API rate limiting enabled
- [ ] Error logging configured
- [ ] Database backups scheduled
- [ ] SSL certificate installed
- [ ] DNS records updated
- [ ] Admin accounts created
- [ ] Test data imported
- [ ] Performance tested at scale

### Build Commands
```bash
# Frontend Production Build
npm run build
# Output: dist/ folder (upload to hosting)

# Backend Deployment
# Copy backend/ folder to server
# Install dependencies: npm install
# Set production environment variables
# Run: npm start
```

---

## 💡 Tips & Tricks

### Debug Mode
```javascript
// In frontend, open DevTools Console
localStorage.setItem('debug', 'true');
// Will log all API requests and responses
```

### Sample Data
```bash
# Populate database with demo items
cd backend
node sample-data.js
```

### Clear All Data (⚠️ Danger)
```bash
# In Firebase Console:
# 1. Go to Firestore Database
# 2. Select each collection
# 3. Delete all documents
# ⚠️ Only in development!
```

### Test Different User Roles
```bash
// Regular user (normal flow)
// Admin user (set in Firebase: role="admin")
// Low trust user (trust_score < 30 for fraud alerts)
```

---

## 📞 Support & Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Express Docs**: https://expressjs.com/
- **React Docs**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **Project Repo**: Check README.md for links

---

## 🎯 Next Steps After Setup

1. **Test the Complete Flow**: Register → Report Item → Get Matches → Verify → Handover
2. **Check Admin Dashboard**: Triple-click logo to access analytics
3. **Review Code**: Read IMPLEMENTATION_GUIDE.md for architecture
4. **Run Tests**: Create test scenarios from Testing Scenarios section
5. **Deploy**: Follow Deployment Preparation steps

---

**Happy Testing! 🎉**

For detailed information, see IMPLEMENTATION_GUIDE.md  
For feature status, see backend/TODO.md  
For full summary, see IMPLEMENTATION_SUMMARY.md
