# Lost&Found AI+ - Complete Code Implementation Guide

## Project Overview
A full-stack AI-powered Lost&Found platform built with:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth + JWT

---

## BACKEND SETUP (✅ COMPLETED)

All backend files have been rewritten with production-quality code:

### ✅ Backend Files Completed:
1. `backend/server.js` - Express server with Firebase initialization
2. `backend/middleware/auth.js` - JWT verification & admin authorization
3. `backend/routes/auth.js` - User registration, login, profile management
4. `backend/routes/items.js` - Lost/found item reporting & search
5. `backend/routes/matches.js` - AI matching engine for item matching
6. `backend/routes/handovers.js` - OTP generation, verification, secure handover
7. `backend/routes/admin.js` - Admin dashboard, analytics, user management
8. `backend/services/matchingService.js` - Advanced text similarity, location matching, time relevance

### Key Backend Features:
- ✅ User registration with password hashing (bcrypt)
- ✅ JWT token-based authentication (7-day expiry)
- ✅ Lost item reporting with image storage
- ✅ Found item reporting with automatic matching
- ✅ AI matching using:
  - Text similarity (Levenshtein + word-level)
  - Location matching (exact, partial, word-level)
  - Time relevance (same day to 1+ months)
  - Category matching
- ✅ Ownership verification with trust score system
- ✅ OTP generation (6-digit, 10-minute expiry)
- ✅ QR code generation for secure handover
- ✅ Admin dashboard with:
  - Recovery rate analytics
  - User trust score distribution
  - Category analysis
  - Location heatmap
  - Suspicious user detection

### Backend API Endpoints:

**Authentication:**
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile
- PUT /api/auth/profile
- POST /api/auth/logout

**Items:**
- POST /api/items/report-lost
- POST /api/items/report-found
- GET /api/items/my-items
- GET /api/items/search
- GET /api/items/:itemId
- PUT /api/items/:itemId
- DELETE /api/items/:itemId
- GET /api/items/category/:category

**Matching:**
- GET /api/matches/find
- GET /api/matches/item/:itemId
- GET /api/matches/user-matches
- POST /api/matches/request-claim
- GET /api/matches/claims/:claimId

**Handovers:**
- POST /api/handovers/verify-owner
- POST /api/handovers/generate-otp
- POST /api/handovers/confirm-handover
- GET /api/handovers/:handoverId

**Admin:**
- GET /api/admin/dashboard-data
- GET /api/admin/users
- GET /api/admin/claims
- POST /api/admin/claim/:claimId/approve
- POST /api/admin/claim/:claimId/reject
- GET /api/admin/handovers
- POST /api/admin/user/:userId/disable
- POST /api/admin/user/:userId/enable
- GET /api/admin/stats/heatmap
- GET /api/admin/audit-log

---

## FRONTEND SETUP (⚠️  IN PROGRESS)

### Required Environment Variables (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Frontend Architecture:

**Core Folders:**
```
src/
├── app/
│   ├── components/
│   │   ├── home-screen.tsx
│   │   ├── report-lost-screen.tsx
│   │   ├── report-found-screen.tsx
│   │   ├── match-results-screen.tsx
│   │   ├── verification-screen.tsx
│   │   ├── handover-screen.tsx
│   │   ├── timeline-screen.tsx
│   │   ├── admin-dashboard.tsx
│   │   ├── glass-card.tsx
│   │   ├── match-card.tsx
│   │   ├── image-upload.tsx
│   │   └── [other UI components]
│   └── App.tsx
├── contexts/
│   └── AuthContext.tsx (Redux-like state management)
├── services/
│   ├── api.ts (API client with all endpoints)
│   └── firebase.ts (Firebase initialization)
└── styles/
    ├── index.css
    ├── theme.css
    └── tailwind.css
```

---

## QUICK START GUIDE

### 1. Backend Setup
```bash
cd backend
npm install
# Create firebase-service-account.json with your credentials
npm start  # or: npm run dev (with nodemon)
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Create .env file with Firebase credentials
npm run dev
```

### 3. Test the Application
- Visit: http://localhost:5173
- Register a new account
- Report a lost or found item
- View AI-suggested matches
- Verify ownership through questions
- Complete secure handover with OTP

---

## DATABASE SCHEMA (Firestore)

### Collections:

**users**
```json
{
  "id": "user_xxx",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "hashed_password",
  "role": "user",
  "trustScore": 100,
  "itemsReported": 5,
  "itemsRecovered": 2,
  "successfulVerifications": 3,
  "failedVerifications": 0,
  "createdAt": "2026-01-31T...",
  "updatedAt": "2026-01-31T..."
}
```

**items**
```json
{
  "id": "lost_xxx",
  "userId": "user_xxx",
  "itemName": "Blue Backpack",
  "category": "bag",
  "description": "Nike backpack with laptop",
  "location": "Central Park",
  "lostDate": "2026-01-30",
  "lostTime": "14:30",
  "imageUrl": "https://...",
  "color": "blue",
  "brand": "Nike",
  "estimatedValue": 150,
  "status": "lost",
  "views": 42,
  "matches": [{ "foundItemId": "...", "score": 85 }],
  "createdAt": "2026-01-31T..."
}
```

**claims**
```json
{
  "id": "claim_xxx",
  "lostItemId": "lost_xxx",
  "foundItemId": "found_yyy",
  "claimerUserId": "user_xxx",
  "finderUserId": "user_yyy",
  "status": "pending|verified|rejected|completed",
  "createdAt": "2026-01-31T..."
}
```

**handovers**
```json
{
  "id": "handover_xxx",
  "claimId": "claim_xxx",
  "otp": "123456",
  "qrCode": "data:image/png;...",
  "status": "pending|completed",
  "location": "Admin Office",
  "receipt": { "transactionId": "RCP_xxx" },
  "createdAt": "2026-01-31T..."
}
```

---

## KEY FEATURES IMPLEMENTED

### ✅ User Authentication
- Email/password registration
- Secure password hashing
- JWT-based sessions
- Profile management
- Trust score tracking

### ✅ Item Reporting
- Lost item form with validation
- Found item form
- Image upload support
- Category selection
- Location tracking
- Detailed descriptions

### ✅ AI Matching Engine
- Text similarity analysis (Levenshtein distance)
- Location-based matching
- Time relevance scoring
- Category matching
- Confidence level classification (High/Medium/Low)
- Top 3 matches returned

### ✅ Ownership Verification
- AI-generated category-specific questions
- Smart scoring with 66% threshold
- Trust score updates (+5 for success, -10 for failure)
- Fraud detection

### ✅ Secure Handover
- 6-digit OTP generation
- 10-minute OTP expiry
- QR code generation
- Digital receipt with transaction ID
- Timeline updates

### ✅ Admin Dashboard
- Real-time analytics
- Recovery rate tracking
- User trust score distribution
- Location heatmap
- Suspicious user alerts
- Handover management
- Claim approval/rejection

### ✅ Advanced UI/UX
- Glassmorphism design
- Dark mode toggle
- Smooth animations
- Responsive mobile design
- Loading states
- Error handling
- Success notifications

---

## DEPLOYMENT

### Deploy to Firebase Hosting (Frontend)
```bash
npm run build
firebase login
firebase deploy
```

### Deploy to Cloud Run (Backend)
```bash
# Create app.yaml
gcloud run deploy lost-found-ai-backend --source .
```

### Environment Variables
Set these in your hosting platform:
- JWT_SECRET (for backend)
- FIREBASE_PROJECT_ID
- FIREBASE_API_KEY
- NODE_ENV=production

---

## SECURITY BEST PRACTICES IMPLEMENTED

✅ Password hashing with bcrypt (10 salt rounds)
✅ JWT token expiration (7 days)
✅ CORS enabled for frontend origin only
✅ Input validation on all endpoints
✅ Image file type validation
✅ File size limits (5MB)
✅ Admin authorization checks
✅ Ownership verification
✅ OTP expiry validation
✅ Error messages without sensitive info

---

## TESTING ENDPOINTS

### Test Lost Item Report
```bash
curl -X POST http://localhost:5000/api/items/report-lost \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemName": "Blue Backpack",
    "category": "bag",
    "description": "Nike backpack with laptop",
    "location": "Central Park",
    "lostDate": "2026-01-30",
    "lostTime": "14:30"
  }'
```

### Test Found Item Report
```bash
curl -X POST http://localhost:5000/api/items/report-found \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemName": "Blue Backpack",
    "category": "bag",
    "description": "Nike backpack found at park",
    "foundLocation": "Central Park",
    "foundDate": "2026-01-31"
  }'
```

### Test Matching
```bash
curl http://localhost:5000/api/matches/find
```

---

## TROUBLESHOOTING

### Backend won't start
- Check Firebase credentials in firebase-service-account.json
- Ensure PORT 5000 is available
- Check Node.js version (14+ required)

### Frontend won't load
- Clear node_modules and reinstall: `npm ci`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check environment variables

### Firebase errors
- Verify credentials are correct
- Check Firestore rules allow read/write
- Ensure database exists

### API 401 errors
- Token may be expired (refresh page to re-login)
- Check JWT_SECRET matches backend
- Verify token format: "Bearer {token}"

---

## NEXT STEPS FOR MANUAL COMPLETION

### Frontend Components Needing Updates:
1. **AuthContext.tsx** - Redux-like state for auth & user data
2. **API Service** - Complete API client with all endpoints
3. **Screen Components** - Wire up to backend APIs
4. **Admin Dashboard** - Charts and analytics visualization
5. **Styling** - Fine-tune glassmorphism and dark mode

### Recommended Implementation Order:
1. Set up AuthContext for state management
2. Create API service client
3. Update login/register screens
4. Connect item reporting screens
5. Implement matching results display
6. Add verification flow
7. Build admin dashboard
8. Polish UI with animations

---

## MONITORING & LOGGING

The backend logs all requests and errors to console. For production:
- Set up Cloud Logging
- Add error tracking (Sentry)
- Monitor API performance
- Track user actions

---

## SUPPORT & DOCUMENTATION

For detailed API documentation, see:
- Backend routes in `/backend/routes/`
- Matching service algorithm in `/backend/services/matchingService.js`
- Frontend components in `/src/app/components/`

---

**Status**: Backend ✅ 100% Complete | Frontend ⚠️ Needs Final Integration

**Last Updated**: January 31, 2026

