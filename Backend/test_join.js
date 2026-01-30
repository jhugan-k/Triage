const axios = require('axios');

// 1. YOUR TOKEN (Same as before)
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFmYmRiMzFkLWVmN2ItNDUzNC05MDE4LTA3NjRiOTQwYjJjNSIsImVtYWlsIjoidGVzdEB0cmlhZ2UuY29tIiwiaWF0IjoxNzY5Njg3NTAxLCJleHAiOjE3NzAyOTIzMDF9.R4MJrYi4BdhWUA87kOWKLTO2sw9C7zMFjvpjtsf8QHU";

// 2. THE ACCESS KEY (From the output of the previous task)
const ACCESS_KEY = "D9F1D4"; 

async function joinDashboard() {
  try {
    const res = await axios.post(
      'http://localhost:4001/dashboards/join', 
      { accessKey: ACCESS_KEY },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    
    console.log("SUCCESS:", res.data.message);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

joinDashboard();