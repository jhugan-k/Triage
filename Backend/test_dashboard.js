const axios = require('axios');

// 1. PASTE YOUR TOKEN HERE (from the previous step)
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFmYmRiMzFkLWVmN2ItNDUzNC05MDE4LTA3NjRiOTQwYjJjNSIsImVtYWlsIjoidGVzdEB0cmlhZ2UuY29tIiwiaWF0IjoxNzY5Njg3NTAxLCJleHAiOjE3NzAyOTIzMDF9.R4MJrYi4BdhWUA87kOWKLTO2sw9C7zMFjvpjtsf8QHU"; 

async function createDashboard() {
  try {
    const res = await axios.post(
      'http://localhost:4001/dashboards', 
      { name: "Project Omega" },
      { headers: { Authorization: `Bearer ${TOKEN}` } } // Sending the ID card
    );
    
    console.log("SUCCESS!");
    console.log("Dashboard ID:", res.data.dashboard.id);
    console.log("Access Key:", res.data.dashboard.accessKey);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

createDashboard();