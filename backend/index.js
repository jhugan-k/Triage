//load environment variables
require('dotenv').config();
//import express and cors
const express = require('express');
const cors = require('cors');

//create an express instance
const app = express();

//define port 
const PORT = process.env.port || 5000;

//enable to use CORS
app.use(cors());

//enable app to use JSON parsing
app.use(express.json());

//GET route 
app.get('/', (req,res) => {
    res.send('Triage Backend is Running!');
});

// listen on port
app.listen(PORT, () => {
    console.log(`Triage Backend Server is running on port ${PORT}`);
});
