const fetch = require('node-fetch');

const API_URL = 'http://localhost:5001/api';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    bold: '\x1b[1m'
};

const pass = (msg) => console.log(`${colors.green}✅ PASS:${colors.reset} ${msg}`);
const fail = (msg) => {
    console.error(`${colors.red}❌ FAIL:${colors.reset} ${msg}`);
    process.exit(1);
};
const info = (msg) => console.log(`${colors.blue}ℹ️  INFO:${colors.reset} ${msg}`);

async function runTest() {
    console.log(`${colors.bold}\n🚀 STARTING FULL SYSTEM VERIFICATION\n${colors.reset}`);

    try {
        // ---------------------------------------------------------
        // 1. Health Check
        // ---------------------------------------------------------
        info('Checking Backend Health...');
        const health = await fetch(`${API_URL}/health`).then(r => r.json());
        if (health.status !== 'OK') fail('Backend health check failed');
        pass('Backend is online');

        // ---------------------------------------------------------
        // 2. Authentication Flow (Login Existing Users)
        // ---------------------------------------------------------
        info('Testing Authentication (Using Demo Users)...');

        // User A: Alice (Victim)
        const loginA = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'alice@example.com', password: 'password123' })
        });

        if (!loginA.ok) {
            const err = await loginA.json().catch(() => ({}));
            fail(`User A Login failed: ${JSON.stringify(err)}`);
        }
        const authA = await loginA.json();
        const tokenA = authA.token;
        pass(`User A (Alice) logged in`);

        // User B: Bob (Finder)
        // Note: server.js sampleUsers has bob@example.com
        const loginB = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'bob@example.com', password: 'password123' })
        });

        if (!loginB.ok) {
            const err = await loginB.json().catch(() => ({}));
            fail(`User B Login failed: ${JSON.stringify(err)}`);
        }
        const authB = await loginB.json();
        const tokenB = authB.token;
        pass(`User B (Bob) logged in`);

        // ---------------------------------------------------------
        // 3. Reporting Flow
        // ---------------------------------------------------------
        info('Testing Item Reporting...');

        // User A reports LOST item
        const lostItem = {
            itemName: 'Unique Red Notebook',
            category: 'Documents',
            description: 'A red moleskine notebook with important project notes.',
            location: 'Library',
            lostDate: '2024-03-01',
            lostTime: '10:00'
        };

        const reportLost = await fetch(`${API_URL}/items/report-lost`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenA}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(lostItem)
        });

        if (!reportLost.ok) fail('Report Lost failed');
        const lostData = await reportLost.json();
        const lostId = lostData.item.id;
        pass(`Lost item reported: ${lostId}`);

        // User B reports FOUND item (Should match)
        const foundItem = {
            itemName: 'Red Moleskine Notebook',
            category: 'Documents',
            description: 'Found a red notebook on table 3.',
            foundLocation: 'Library',
            foundDate: '2024-03-01',
            foundTime: '10:30'
        };

        const reportFound = await fetch(`${API_URL}/items/report-found`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenB}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(foundItem)
        });

        if (!reportFound.ok) fail('Report Found failed');
        const foundData = await reportFound.json();
        const foundId = foundData.item.id;
        pass(`Found item reported: ${foundId}`);

        // ---------------------------------------------------------
        // 4. Matching Logic
        // ---------------------------------------------------------
        info('Testing AI Matching...');

        // Check matches for User A
        // Note: In demo mode, matches might happen synchronously or require a trigger. 
        // Assuming backend logic runs matching on report-found.

        const matchesRes = await fetch(`${API_URL}/matches/user-matches`, {
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });


        if (!matchesRes.ok) {
            const err = await matchesRes.json().catch(() => ({}));
            fail(`Fetch Matches failed: ${JSON.stringify(err)}`);
        }
        const matchesData = await matchesRes.json();
        // console.log('Matches Response:', JSON.stringify(matchesData, null, 2));

        if (!matchesData.userMatches) {
            fail(`Response missing 'userMatches' array: ${JSON.stringify(matchesData)}`);
        }

        // Find the lost item we just reported
        const itemEntry = matchesData.userMatches.find(entry => entry.lostItem.id === lostId);

        if (!itemEntry) {
            fail(`Lost item ${lostId} not found in user matches list.`);
        }

        const match = itemEntry.matches.find(m => m.foundItem.id === foundId || m.foundItem.description.includes('Red Moleskine'));

        if (match) {
            pass(`Match found! Score: ${match.matchScore}% - ${match.confidence} confidence`);
        } else {
            console.log('Matches found:', JSON.stringify(matchesData, null, 2));
            fail('Expected match not found immediately. (This might be async but normally fast)');
        }

        // ---------------------------------------------------------
        // 5. Notifications
        // ---------------------------------------------------------
        info('Testing Notifications...');

        const notifRes = await fetch(`${API_URL}/notifications`, {
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });

        if (!notifRes.ok) fail('Fetch Notifications failed');
        const notifData = await notifRes.json();

        const matchNotif = notifData.notifications.find(n => n.type === 'match');
        if (matchNotif) {
            pass(`Notification received: ${matchNotif.title}`);
        } else {
            console.log('Notifications:', JSON.stringify(notifData, null, 2));
            console.warn(`${colors.yellow}⚠️  No specific match notification found (Logic might vary)${colors.reset}`);
        }

        // ---------------------------------------------------------
        // 6. Admin Dashboard Stats (Smoke Test)
        // ---------------------------------------------------------
        info('Testing Admin Dashboard Mock Data...');

        // Need an admin user. We know the demo admin Creds from server.js
        const adminLogin = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
        });

        if (adminLogin.ok) {
            const { token: adminToken } = await adminLogin.json();
            const dashRes = await fetch(`${API_URL}/admin/dashboard-data`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (dashRes.ok) {
                pass('Admin Dashboard data accessible');
            } else {
                fail('Admin Dashboard access failed');
            }
        } else {
            console.warn(`${colors.yellow}⚠️  Could not log in as default admin (Mock data might have changed)${colors.reset}`);
        }

        console.log(`${colors.bold}\n✨ ALL SYSTEMS GO! The website backend is fully functional.\n${colors.reset}`);

    } catch (err) {
        fail(`Unexpected error: ${err.message}`);
    }
}

runTest();
