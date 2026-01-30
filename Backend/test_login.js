// Run this with: node test_login.js
const axios = require('axios'); // You installed this earlier

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:4001/auth/login', {
      email: "test@triage.com",
      name: "Test Admin"
    });
    console.log("LOGIN SUCCESS!");
    console.log("Token:", res.data.token);
    console.log("User ID:", res.data.user.id);
  } catch (err) {
    console.error("Login Failed:", err.response ? err.response.data : err.message);
  }
}

testLogin();