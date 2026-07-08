async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'Alkaaja@gmail.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    const catRes = await fetch('http://localhost:5000/api/finance/categories', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!catRes.ok) {
        const errorData = await catRes.text();
        console.error("Error fetching categories:", catRes.status, errorData);
    } else {
        const catData = await catRes.json();
        console.log("Categories fetched successfully:", catData.length);
    }
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}
test();
