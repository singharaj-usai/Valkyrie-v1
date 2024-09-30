const express = require("express");
const path = require("path");
const { isAuthenticated, isNotAuthenticated } = require("../middleware/auth");

const messagesRoutes = require('./messages'); // Add this line

const forumRoutes = require('./forum');

const router = express.Router();

router.get("/navbar", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/components/navbar.html"));
});

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/authentication/login.html"));
});

router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/authentication/register.html"));
});

router.get("/users", (req, res) => {
    res.sendFile(path.join(__dirname, "../../../../client/html/pages/users/users.html"));
});

router.get("/user-profile", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/profile/user-profile.html"));
});

router.get("/forum/home", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/forum/home.html"));
});

router.get("/forum/new/post", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/forum/new/post.html"));
});

router.get("/forum/new/reply", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/forum/new/reply.html"));
});

router.get("/forum/post", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/forum/post.html"));
});

router.get("/catalog", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/catalog/catalog.html"));
});

router.get("/places", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/places/places.html"));
});

router.get("/my/friends", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/my/friends.html"));
});

router.get("/my/messages", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/my/messages.html"));
});

router.get("/upload", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/upload/upload.html"));
});

router.get("/games", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/games/games.html"));
});

router.get("/game", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/game/game.html"));
});

router.get("/forum/sections/:section", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/forum/sections/section.html"));
});



router.use('/api/forum', forumRoutes);

router.use("/api/messages", messagesRoutes); // Add this middleware

// Route to serve the "My Messages" page
router.get("/messages", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/my/messages.html"));
});

router.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../../client/html/pages/admin/dashboard.html'));
});

router.get("/messages/compose", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/my/compose/compose.html"));
});

router.get("/legal/about", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/legal/about.html"));
});

router.get("/legal/terms-of-service", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/legal/terms-of-service.html"));
});

router.get("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/html/pages/legal/privacy/privacy.html"));
});

module.exports = router;
