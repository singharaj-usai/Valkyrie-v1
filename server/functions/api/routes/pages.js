const express = require("express");
const path = require("path");
const { isAuthenticated, isNotAuthenticated } = require("../middleware/auth");

const messagesRoutes = require('./messages'); // Add this line

const router = express.Router();

router.get("/navbar", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/navbar.html"));
});

router.get("/login", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/login.html"));
});

router.get("/register", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/register.html"));
});

router.get("/search-results", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/search-results.html"));
});

router.get("/user-profile", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/user-profile.html"));
});

router.use("/api/messages", messagesRoutes); // Add this middleware

// Route to serve the "My Messages" page
router.get("/messages", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/my/messages.html"));
});

router.get("/messages/compose", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/compose.html"));
});


module.exports = router;
