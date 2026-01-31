# Lost&Found AI+ – Smart Item Recovery System

A modern, AI-powered Lost&Found platform that uses smart matching algorithms, ownership verification, and secure handover processes to reunite people with their lost items.

## 🎯 Objective

Lost&Found AI+ helps users report, match, and recover lost items in colleges, offices, events, and public areas while ensuring items are returned only to rightful owners through a secure, verified process.

## ✨ Core Features

### 1️⃣ Report Lost Item
- Step-by-step progressive form with AI helper tooltips
- Users submit: item name, category, description, location, image, and time
- AI-generated ownership verification questions

### 2️⃣ Report Found Item
- Similar reporting flow for found items
- Drag-and-drop image upload with location pin on map
- Automatic matching against lost items

### 3️⃣ AI Match Suggestions
- Automatic intelligent matching using:
  - **Text Similarity**: Advanced Levenshtein distance algorithm (word-level + character-level matching)
  - **Location Match**: Smart location proximity detection
  - **Time Relevance**: Temporal proximity scoring
  - **Optional Image Similarity**: Visual comparison
- Top 3 matches displayed with detailed score breakdown and confidence indicators

### 4️⃣ Ownership Verification
- **AI-Generated Questions**: Context-aware questions based on item category
- **Smart Scoring**: Partial matching with 66% threshold (2 out of 3 answers)
- **Trust Score System**:
  - +1 point for successful verification
  - -2 points for failed verification
  - Progressive trust building for reliable users

### 5️⃣ Secure Handover
- **OTP Verification**: 6-digit OTP with 10-minute expiry
- **QR Code**: Unique QR code for each handover
- **Digital Receipt**: Timestamped receipt with transaction number
- **Timeline Update**: Full item journey tracking from report → recovery

### 6️⃣ Admin Dashboard
- **Real-time Analytics**: Total items, recovery rate, fraud alerts
- **Heatmap Visualization**: Location-based lost item distribution
- **Trust Score Distribution**: User reliability metrics
- **Fraud Alerts**: Automatic detection of suspicious users
- **Handover Management**: Approval/rejection workflow with admin audit logs

## 🎨 Advanced UI/UX Features

- **Glassmorphic Design**: Modern glass-morphism with deep blue → teal gradient
- **Dark Mode**: Smooth transition with system preference detection
- **Animated Transitions**:
  - Match score rings with smooth animations
  - Timeline progression animations
  - Confetti on successful recovery
  - Button ripple effects
  - AI typing effects for tooltips
- **Responsive Design**: Mobile-first architecture
- **Micro-interactions**: Hover effects, smooth number count-ups, loading states

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** with TypeScript
- **Tailwind CSS 4.1.12** for styling
- **Motion (Framer Motion alternative)** for animations
- **Recharts** for admin analytics charts
- **React Hook Form** for form management
- **Radix UI** component library

### Backend
- **Node.js + Express 4.18.2** REST API
- **Firebase Admin SDK 12.0.0** for database & storage
- **Firebase Firestore** for real-time database
- **Firebase Storage** for image hosting
- **JWT Authentication** for secure user sessions
- **bcrypt** for password hashing
- **QRCode** for secure verification codes

### AI & Matching
- **Advanced Text Similarity**: Levenshtein distance algorithm for smart text matching
- **Location Proximity**: Intelligent location-based scoring
- **Verification Questions**: Category-specific AI-generated questions
- **Trust Score Engine**: Dynamic scoring system for fraud prevention

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm/pnpm
- Firebase project with service account key
- Environment variables configured

### Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure Firebase URL
# VITE_API_URL=http://localhost:5000/api

# Run development server
npm run dev

# Build for production
npm run build
```

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure Firebase
# FIREBASE_PROJECT_ID=...
# FIREBASE_PRIVATE_KEY=...
# FIREBASE_STORAGE_BUCKET=...
# JWT_SECRET=your-secret-key
# PORT=5000

# Start server
npm start

# Development mode with auto-reload
npm run dev
```

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Items
- `POST /api/items/report-lost` - Report lost item
- `POST /api/items/report-found` - Report found item
- `GET /api/items/my-lost-items` - Get user's lost items
- `GET /api/items/my-found-items` - Get user's found items
- `GET /api/items/verification-questions/:category` - Get AI verification questions
- `PUT /api/items/:itemId/verification-answers` - Update verification answers

### Matches
- `GET /api/matches/match-items?lostItemId=:id` - Get top 3 AI matches
- `GET /api/matches/item-matches/:lostItemId` - Get all matches for item

### Handovers
- `POST /api/handovers/verify-owner` - Verify ownership with answers
- `POST /api/handovers/generate-otp` - Generate OTP & QR code
- `POST /api/handovers/confirm-handover` - Confirm with OTP
- `GET /api/handovers/:handoverId` - Get handover details

### Admin
- `GET /api/admin/dashboard-data` - Get analytics & heatmap data
- `POST /api/admin/approve-handover` - Admin approve handover
- `POST /api/admin/reject-handover` - Admin reject handover
- `GET /api/admin/handovers` - Get all handovers for review

## 📊 Matching Algorithm Details

The AI matching engine uses a weighted multi-criteria approach:

```
Total Score = (
  Text Similarity × 0.5 +
  Location Match × 0.3 +
  Time Relevance × 0.2 +
  Image Similarity × 0.1
)
```

### Text Similarity
- Word-level matching: 60% weight
- Character-level (Levenshtein): 40% weight
- Range: 0-100%

### Location Match
- Exact match: 100%
- Contains match: 75%
- Word similarity fallback: 0-75%

### Time Relevance
- Within 24 hours: 100%
- Within 3 days: 75%
- Within 1 week: 50%
- Within 1 month: 25%
- Older: 0%

### Image Similarity
- Basic filename keyword matching
- Color detection from metadata
- Model number extraction
- Range: 20-95%

## 🔐 Security Features

- **JWT Authentication**: Secure session management
- **Password Hashing**: bcrypt with salt rounds 10
- **OTP Verification**: Time-limited (10 minutes) 6-digit codes
- **QR Codes**: Unique per handover transaction
- **Trust Score System**: Fraud detection through behavioral patterns
- **Admin Audit Logs**: All admin actions tracked
- **Firebase Security Rules**: Firestore access control

## 🎮 Demo Mode

For quick demos and judging:
- Pre-loaded sample data with realistic matches
- Fast matching algorithm (< 100ms)
- Demo admin credentials included
- Sample heatmap with populated locations

## 📈 Key Metrics Tracked

- **Recovery Success Rate**: % of items successfully recovered
- **Average Match Quality**: Mean match score across all items
- **User Trust Distribution**: Low/Medium/High trust score breakdown
- **Category Distribution**: Most common lost item types
- **Location Heatmap**: Geographic concentration of lost items
- **Fraud Alerts**: Users with suspicious activity patterns
- **Response Time**: Time from report to first match
- **Handover Completion Rate**: % of verified items successfully handed over

## 🎯 Future Enhancements

- [ ] Image recognition using TensorFlow.js for visual matching
- [ ] Email/SMS notifications for matches
- [ ] Mobile app with geolocation integration
- [ ] Community chat for item coordination
- [ ] Advanced ML-based fraud detection
- [ ] Integration with local authorities
- [ ] Blockchain-based verification for high-value items
- [ ] Multi-language support

## 📝 License

This project is part of the Lost&Found AI+ hackathon initiative.

## 👥 Credits

- UI/UX Design: Figma Premium Recovery App UI
- Backend Architecture: Firebase + Express.js
- Frontend Framework: React + Tailwind CSS + Motion
- AI Algorithms: Custom matching & verification engines

## 📞 Support

For issues and feature requests, please create an issue in the repository.

---

**✅ Pitch Line:** "Lost&Found AI+ is a smart, AI-powered item recovery system that matches, verifies, and safely returns lost items while tracking the complete recovery journey with advanced UI/UX and secure handovers."
