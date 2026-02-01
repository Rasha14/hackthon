#!/bin/bash
# Lost&Found AI+ - Quick Start Script
# Run this to get the application started

echo "🚀 Lost&Found AI+ - Quick Start"
echo "================================="
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not installed. Please install Node.js 16+"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "✓ Found $NODE_VERSION"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend || exit 1
npm install
if [ $? -ne 0 ]; then
    echo "✗ Backend installation failed"
    exit 1
fi
echo "✓ Backend dependencies installed"
cd .. || exit 1
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "✗ Frontend installation failed"
    exit 1
fi
echo "✓ Frontend dependencies installed"
echo ""

# Create .env files
echo "⚙️  Creating environment files..."

if [ ! -f ".env" ]; then
    cat > .env << EOF
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=AIzaSyBw5mGmXmL2cmWFAw9K675P-mKgXrJRVJk
VITE_FIREBASE_AUTH_DOMAIN=hackthon-281b2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hackthon-281b2
VITE_FIREBASE_STORAGE_BUCKET=hackthon-281b2.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=631295249130
VITE_FIREBASE_APP_ID=1:631295249130:web:8edae8331658df66562593
EOF
    echo "✓ Created .env"
else
    echo "✓ .env already exists"
fi

if [ ! -f "backend/.env" ]; then
    cat > backend/.env << EOF
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret_here_change_in_production
FIREBASE_PROJECT_ID=hackthon-281b2
EOF
    echo "✓ Created backend/.env"
else
    echo "✓ backend/.env already exists"
fi
echo ""

# Ready to start
echo "✅ Setup complete!"
echo ""
echo "🎬 To start the application, run in separate terminals:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && npm start"
echo ""
echo "Terminal 2 (Frontend):"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "📚 Documentation:"
echo "  - DEPLOYMENT_GUIDE.md - Complete deployment guide"
echo "  - FRONTEND_IMPLEMENTATION_GUIDE.md - Services guide"
echo "  - COMPONENT_INTEGRATION_TEMPLATE.md - Code templates"
echo ""
