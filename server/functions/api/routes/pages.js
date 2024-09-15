const express = require("express");
const path = require("path");
const { isAuthenticated, isNotAuthenticated } = require("../middleware/auth");

const messagesRoutes = require('./messages'); // Add this line

const router = express.Router();

router.get("/navbar", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/views/navbar.html"));
});

router.get("/login", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/views/login.html"));
});

router.get("/register", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/views/register.html"));
});

router.get("/search-results", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/views/search-results.html"));
});

router.get("/user-profile", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/views/user-profile.html"));
});

router.use("/api/messages", messagesRoutes); // Add this middleware

router.get("/messages/compose", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/views/compose.html"));
});


module.exports = router;
