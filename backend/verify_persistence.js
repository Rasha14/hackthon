const fetch = require('node-fetch'); // Ensure node-fetch is available or use native fetch if node 18+

const API_URL = 'http://localhost:5001/api';

async function testPersistence() {
    try {
        // 1. Login
        console.log('--- 1. Login ---');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'alice@example.com', password: 'password123' })
        });

        if (!loginRes.ok) throw new Error('Login failed');
        const { token, user } = await loginRes.json();
        console.log(`Logged in as ${user.name}`);
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Report Lost Item
        console.log('\n--- 2. Report Lost Item ---');
        const newItem = {
            itemName: 'Test Persistent Item ' + Date.now(),
            category: 'Electronics',
            description: 'A test item to verify mock DB persistence',
            location: 'Test Lab',
            lostDate: '2024-01-01',
            lostTime: '12:00'
        };

        const reportRes = await fetch(`${API_URL}/items/report-lost`, {
            method: 'POST',
            headers,
            body: JSON.stringify(newItem)
        });

        if (!reportRes.ok) {
            const err = await reportRes.json();
            throw new Error(`Report failed: ${err.message}`);
        }
        const reportData = await reportRes.json();
        const itemId = reportData.item.id;
        console.log(`Reported item ${itemId}: ${reportData.item.itemName}`);

        // 3. Verify Retrieval (My Items)
        console.log('\n--- 3. Verify Retrieval (My Items) ---');
        const myItemsRes = await fetch(`${API_URL}/items/my-items`, { headers });
        const myItems = await myItemsRes.json();

        const foundMyItem = myItems.items.find(i => i.id === itemId);
        if (foundMyItem) {
            console.log('✅ Item found in My Items list');
        } else {
            console.error('❌ Item NOT found in My Items list');
            console.log('My Items:', myItems.items.map(i => i.id));
        }

        // 4. Verify Search
        console.log('\n--- 4. Verify Search ---');
        const searchRes = await fetch(`${API_URL}/items/search?q=Persistent`, { headers });
        const searchData = await searchRes.json();
        const foundSearchItem = searchData.items.find(i => i.id === itemId);

        if (foundSearchItem) {
            console.log('✅ Item found in Search results');
        } else {
            console.error('❌ Item NOT found in Search results');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

testPersistence();
