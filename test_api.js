async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'Alkaaja@gmail.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    console.log('Login token:', loginData.token ? 'Yes' : 'No');
    
    const token = loginData.token;
    
    // test dashboard
    const res = await fetch('http://localhost:5000/api/finance/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const resData = await res.json();
    if (!res.ok) console.error('Dashboard Error:', resData);
    else console.log('Dashboard Data keys:', Object.keys(resData));
    
    // test journals
    const res2 = await fetch('http://localhost:5000/api/finance/journals', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const res2Data = await res2.json();
    if (!res2.ok) console.error('Journals Error:', res2Data);
    else console.log('Journals array length:', res2Data.length);
    
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
