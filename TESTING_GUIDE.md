# Lost&Found AI+ - Testing & Running Guide

## Prerequisites

✅ Node.js 16+  
✅ npm or yarn  
✅ Firebase credentials (included)  
✅ Backend and frontend dependencies installed  

## 🚀 Running the Application

### Method 1: Automated Setup (Recommended)

**Windows:**
```bash
setup.cmd
```

**macOS/Linux:**
```bash
bash setup.sh
```

This will:
1. Install all dependencies
2. Create .env files
3. Show instructions to start services

### Method 2: Manual Setup

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
# Runs on http://localhost:5000
# You should see: Server running on port 5000
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
# Runs on http://localhost:5173
# You should see: VITE v[version] ready
```

**Terminal 3 (Optional) - Firebase Emulator:**
```bash
cd backend
firebase emulators:start
# For local Firebase development
```

### Open in Browser

```
http://localhost:5173
```

---

## 📝 Testing the Application

### Test User Accounts

**Admin User** (For testing admin dashboard):
```
Email: admin@test.com
Password: Admin@12345
```

**Regular User** (For testing normal flow):
```
Email: user@test.com
Password: User@12345
```

### Test Scenarios

#### 1. **Registration & Login**

1. Open http://localhost:5173
2. Click "Get Started" or navigate to home screen
3. Register with new email:
   - Email: `newtester@example.com`
   - Password: `Pass@12345`
   - Name: `Test User`
   - Phone: `+1234567890` (optional)
4. Should redirect to home screen
5. Logout and login again to test login flow

#### 2. **Report Lost Item**

1. Login with test account
2. Click "Report Lost Item"
3. Fill out form:
   - **Item Name:** Blue Backpack
   - **Category:** Bag
   - **Description:** Nike backpack with laptop compartment
   - **Location:** Central Park
   - **Lost Date:** (pick a date)
   - **Lost Time:** 14:30
   - **Color:** Blue
   - **Brand:** Nike
4. Optionally upload an image
5. Click "Report Item"
6. Should see success message

#### 3. **Report Found Item**

1. Click "Report Found Item"
2. Fill similar form but for found item
3. **Found Location:** Where you found it
4. Click "Report Item"

#### 4. **View Matches**

1. After reporting items, click "View All Matches"
2. System should show AI-matched items
3. Each match shows:
   - Item name
   - Match score (0-100)
   - Confidence level (High/Medium/Low)
   - Why they match

#### 5. **Claim Item**

1. On a match result, click "Claim This Item"
2. System creates a claim request
3. Redirects to verification screen

#### 6. **Ownership Verification**

1. Answer verification questions (category-specific)
2. Need 2 of 3 correct (66% threshold)
3. If successful: Trust score +5
4. If failed: Trust score -10
5. On success, proceeds to handover

#### 7. **Secure Handover**

1. After verification, receive OTP (6 digits)
2. See QR code for verification
3. OTP valid for 10 minutes
4. Recipient enters OTP to complete handover
5. Digital receipt generated
6. Item status changes to "recovered"

#### 8. **Admin Dashboard**

1. Login as admin user
2. Triple-click the "Lost&Found AI+" logo (only visible to admins)
3. Should open Admin Dashboard with:
   - Real-time analytics
   - Trust score distribution
   - Recovery rate
   - Suspicious users list
   - Location heatmap
   - Claim management
   - User management
   - Audit logs

#### 9. **User Timeline**

1. As regular user, click "My Timeline"
2. Shows all your reported items
3. Shows status of each item
4. Shows claims and handovers

---

## 🧪 API Testing with curl

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testuser@example.com",
    "password":"Pass@12345",
    "name":"Test User",
    "phone":"+1234567890"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_xxx",
    "email": "testuser@example.com",
    "name": "Test User",
    "trustScore": 100
  }
}
```

### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testuser@example.com",
    "password":"Pass@12345"
  }'
```

### Report Lost Item
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
    "lostTime": "14:30",
    "color": "blue",
    "brand": "Nike",
    "estimatedValue": 150
  }'
```

### Search Items
```bash
curl -X GET "http://localhost:5000/api/items/search?q=backpack&category=bag&status=lost" \
  -H "Content-Type: application/json"
```

### Get Matches for Item
```bash
curl -X GET http://localhost:5000/api/matches/item/lost_xxx \
  -H "Content-Type: application/json"
```

### Request Claim
```bash
curl -X POST http://localhost:5000/api/matches/request-claim \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lostItemId": "lost_xxx",
    "foundItemId": "found_yyy"
  }'
```

### Verify Ownership
```bash
curl -X POST http://localhost:5000/api/handovers/verify-owner \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "claimId": "claim_xxx",
    "answers": ["Answer1", "Answer2", "Answer3"]
  }'
```

### Generate OTP
```bash
curl -X POST http://localhost:5000/api/handovers/generate-otp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "claimId": "claim_xxx",
    "location": "Police Station"
  }'
```

### Confirm Handover
```bash
curl -X POST http://localhost:5000/api/handovers/confirm-handover \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "handoverId": "handover_xxx",
    "otp": "123456"
  }'
```

### Get Admin Dashboard Data
```bash
curl -X GET http://localhost:5000/api/admin/dashboard-data \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🐛 Troubleshooting

### Issue: "Cannot GET /"
**Solution:** Frontend not running. Start with `npm run dev`

### Issue: "Cannot POST /api/auth/register"
**Solution:** Backend not running. Start with `cd backend && npm start`

### Issue: "CORS error"
**Solution:** 
- Backend CORS might be misconfigured
- Check that VITE_API_BASE_URL matches backend address
- Verify backend is running on port 5000

### Issue: "Firebase error: permission-denied"
**Solution:**
- Check Firestore security rules
- In development, set rules to allow all read/write
- Go to Firebase Console → Firestore → Rules → Test Mode

### Issue: "401 Unauthorized"
**Solution:**
- Token expired (refresh page)
- Wrong Authorization header format
- Should be: `Authorization: Bearer <token>`

### Issue: "Image upload fails"
**Solution:**
- File size > 5MB (limit is 5MB)
- File format not JPEG/PNG/WebP/GIF
- Firebase Storage permissions

### Issue: "Port already in use"
**Solution:**
```bash
# Change backend port
# Edit backend/.env and change PORT

# For frontend
npm run dev -- --port 3000
```

---

## 📊 Monitoring

### Backend Logs

The backend logs all requests and errors:
```
POST /api/auth/login - 200 OK
POST /api/items/report-lost - 201 Created
GET /api/matches/item/xxx - 200 OK
```

### Frontend Console

Check browser DevTools Console for:
- Service loading
- API calls
- Auth state changes
- Errors

### Firebase Console

Monitor at: https://console.firebase.google.com/
- Firestore collections
- User authentication
- Storage files
- Analytics

---

## 🎯 Complete Testing Checklist

- [ ] Register new user
- [ ] Login with email/password
- [ ] View home dashboard
- [ ] Report lost item
- [ ] Report found item
- [ ] Search for items
- [ ] View matches
- [ ] Request claim
- [ ] Answer verification questions
- [ ] Pass verification (trust +5)
- [ ] Fail verification (trust -10)
- [ ] Generate OTP
- [ ] Scan QR code
- [ ] Confirm handover with OTP
- [ ] View item as recovered
- [ ] Access user timeline
- [ ] Toggle dark mode
- [ ] View admin dashboard
- [ ] View analytics
- [ ] Check heatmap
- [ ] Logout

---

## ✅ Success Indicators

### Backend Running
```
✓ Server running on port 5000
✓ Firebase initialized
✓ Database connected
✓ Ready to accept requests
```

### Frontend Running
```
✓ VITE v[version] ready in [time]ms
✓ ➜  Local: http://localhost:5173/
✓ ➜  press h to show help
```

### Services Connected
```
✓ Firebase auth working
✓ Firestore queries successful
✓ Image uploads working
✓ API endpoints responding
```

---

## 🚀 Performance Tips

1. **Clear Cache:** Press Ctrl+F5 in browser
2. **Check Network:** DevTools → Network tab
3. **Monitor Performance:** DevTools → Performance tab
4. **Check Firebase:** Console → Firestore → Indexes

---

## 📚 Next Steps

After successful testing:

1. **Deploy Frontend:** Vercel, Netlify, or GitHub Pages
2. **Deploy Backend:** Cloud Run, Heroku, or AWS
3. **Set Production Firebase Rules**
4. **Enable Authentication Methods**
5. **Configure Email Templates**
6. **Set Up Monitoring**

---

## 💡 Tips

- Use browser DevTools for debugging
- Check backend logs for API errors
- Monitor Firestore usage in Firebase Console
- Test on multiple devices/browsers
- Use curl for API testing
- Keep logs open while testing

---

**Status:** Ready to Test! 🎉

Start with `npm run dev` and `cd backend && npm start`

Open http://localhost:5173 in your browser!
