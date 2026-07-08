async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'Alkaaja@gmail.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    const incomesRes = await fetch('http://localhost:5000/api/finance/incomes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!incomesRes.ok) {
        const errorData = await incomesRes.text();
        console.error("Error fetching incomes:", incomesRes.status, errorData);
    } else {
        const incomesData = await incomesRes.json();
        console.log("Incomes fetched successfully:", incomesData.length);
    }
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}
test();
