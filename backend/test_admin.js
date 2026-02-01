const API_URL = 'http://localhost:5001/api';

async function testAdmin() {
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

        if (!loginRes.ok) {
            const errText = await loginRes.text();
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText} - ${errText}`);
        }
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✅ Admin Login Successful. Token obtained.');
        console.log('Role:', loginData.user.role);

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        console.log('\n--- 2. Fetching Dashboard Data ---');
        const dashRes = await fetch(`${API_URL}/admin/dashboard-data`, { headers });
        if (!dashRes.ok) throw new Error(`Dashboard fetch failed: ${dashRes.statusText}`);
        const dashData = await dashRes.json();
        console.log('✅ Dashboard Data Retrieved:');
        console.log('Summary:', dashData.summary);

        console.log('\n--- 3. Fetching Users ---');
        const usersRes = await fetch(`${API_URL}/admin/users`, { headers });
        const usersData = await usersRes.json();
        console.log(`✅ Retrieved ${usersData.count} users.`);

        console.log('\n--- 4. Fetching Claims ---');
        const claimsRes = await fetch(`${API_URL}/admin/claims`, { headers });
        const claimsData = await claimsRes.json();
        console.log(`✅ Retrieved ${claimsData.count} claims.`);

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

testAdmin();
