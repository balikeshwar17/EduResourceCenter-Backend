const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const paperRoutes=require('./routes/paperRoutes');
const adminRoutes=require('./routes/adminRoutes');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const cors = require('cors');


// database 
require('./config/config');

// Initialize Express apps
const app = express();

app.use(
  cors({
    // origin: "https://eduresourcecenter.netlify.app",
    origin: "http://localhost:3000",
    credentials: true, 
  })
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.use(cookieParser());

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));



// Routes 
app.use('/api/users', userRoutes);
app.use('/api/admins', adminRoutes); 
app.use('/api/papers',paperRoutes);


// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
