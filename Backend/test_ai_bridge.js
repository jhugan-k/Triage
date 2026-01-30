const axios = require('axios');

// 1. Config
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFmYmRiMzFkLWVmN2ItNDUzNC05MDE4LTA3NjRiOTQwYjJjNSIsImVtYWlsIjoidGVzdEB0cmlhZ2UuY29tIiwiaWF0IjoxNzY5Njg3NTAxLCJleHAiOjE3NzAyOTIzMDF9.R4MJrYi4BdhWUA87kOWKLTO2sw9C7zMFjvpjtsf8QHU";
const DASHBOARD_ID = "06be2d26-6d95-4acc-ae00-d787e0e84a90"; // Get this from the previous task output

// 2. The Test Data (A Critical Bug)
const bugData = {
  title: "Payment System Failure",
  description: "Users are getting charged double when they click checkout. Database deadlock detected.",
  dashboardId: DASHBOARD_ID
};

async function testBridge() {
  try {
    console.log("Sending Bug to Backend...");
    
    const res = await axios.post(
      'http://localhost:4001/bugs', 
      bugData,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    
    console.log("------------------------------------------------");
    console.log("BUG CREATED SUCCESSFULLY!");
    console.log("Title:   ", res.data.bug.title);
    console.log("AI SAYS: ", res.data.bug.severity); // Should be 'High'
    console.log("------------------------------------------------");
    
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

testBridge();