const express = require("express");
const path = require("path");
const { isAuthenticated, isNotAuthenticated } = require("../middleware/auth");

const messagesRoutes = require('./messages'); // Add this line

const forumRoutes = require('./forum');

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

router.get("/users", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/users.html"));
});

router.get("/user-profile", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/user-profile.html"));
});

router.get("/forum/home", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/forum/home.html"));
});

router.get("/forum/new/post", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/forum/new/post.html"));
});

router.get("/forum/post", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/forum/post.html"));
});

router.use('/api/forum', forumRoutes);

router.use("/api/messages", messagesRoutes); // Add this middleware

// Route to serve the "My Messages" page
router.get("/messages", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/my/messages.html"));
});

router.get("/messages/compose", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/compose.html"));
});


module.exports = router;
