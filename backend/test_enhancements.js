const API_URL = 'http://localhost:5001/api';

async function testEnhancements() {
    try {
        console.log('--- 1. Logging in as Admin ---');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'password123'
            })
        });

        if (!loginRes.ok) throw new Error('Login failed');
        const { token } = await loginRes.json();
        const headers = { 'Authorization': `Bearer ${token}` };

        console.log('\n--- 2. Testing Heatmap API ---');
        const heatmapRes = await fetch(`${API_URL}/admin/stats/heatmap`, { headers });
        if (heatmapRes.ok) {
            const heatmapData = await heatmapRes.json();
            console.log('✅ Heatmap Data:', heatmapData);
        } else {
            console.error('❌ Heatmap API Failed:', heatmapRes.status, heatmapRes.statusText);
        }

        console.log('\n--- 3. Testing Notifications API ---');
        // Admin user might not have items reported, but let's check basic response
        const notifRes = await fetch(`${API_URL}/notifications`, { headers });
        if (notifRes.ok) {
            const notifData = await notifRes.json();
            console.log('✅ Notifications:', notifData);
        } else {
            console.error('❌ Notifications API Failed:', notifRes.status, notifRes.statusText);
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

testEnhancements();
