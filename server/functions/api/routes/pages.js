const express = require("express");
const path = require("path");
const { isAuthenticated, isNotAuthenticated } = require("../middleware/auth");

const messagesRoutes = require('./messages');
const forumRoutes = require('./forum');

const router = express.Router();

// Helper function to simplify file path creation
const sendHtmlFile = (res, relativePath) => {
  res.sendFile(path.join(__dirname, "../../../../client/html", relativePath));
};

// Authentication pages
router.get("/login", (req, res) => sendHtmlFile(res, "pages/authentication/login.html"));
router.get("/register", (req, res) => sendHtmlFile(res, "pages/authentication/register.html"));

// User-related pages
router.get("/users", (req, res) => sendHtmlFile(res, "pages/users/users.html"));
router.get("/user-profile", (req, res) => sendHtmlFile(res, "pages/profile/user-profile.html"));

// Forum pages
router.get("/forum/home", (req, res) => sendHtmlFile(res, "pages/forum/home.html"));
router.get("/forum/new/post", (req, res) => sendHtmlFile(res, "pages/forum/new/post.html"));
router.get("/forum/new/reply", (req, res) => sendHtmlFile(res, "pages/forum/new/reply.html"));
router.get("/forum/post", (req, res) => sendHtmlFile(res, "pages/forum/post.html"));
router.get("/forum/sections/:section", (req, res) => sendHtmlFile(res, "pages/forum/sections/section.html"));

// Catalog  page
router.get("/catalog", (req, res) => sendHtmlFile(res, "pages/catalog/catalog.html"));

// User's personal pages
router.get("/my/create", (req, res) => sendHtmlFile(res, "pages/my/create/create.html"));
router.get("/my/friends", (req, res) => sendHtmlFile(res, "pages/my/friends.html"));
router.get("/my/messages", (req, res) => sendHtmlFile(res, "pages/my/messages.html"));
router.get("/messages/compose", (req, res) => sendHtmlFile(res, "pages/my/compose/compose.html"));

// Upload page
router.get("/upload", (req, res) => sendHtmlFile(res, "pages/upload/upload.html"));

// Games pages
router.get("/games", (req, res) => sendHtmlFile(res, "pages/games/games.html"));
router.get("/game", (req, res) => sendHtmlFile(res, "pages/game/game.html"));

// Admin pages
router.get('/admin/dashboard', (req, res) => sendHtmlFile(res, 'pages/admin/dashboard.html'));

// Legal pages
router.get("/legal/about", (req, res) => sendHtmlFile(res, "pages/legal/about.html"));
router.get("/legal/terms-of-service", (req, res) => sendHtmlFile(res, "pages/legal/terms-of-service.html"));
router.get("/privacy", (req, res) => sendHtmlFile(res, "pages/legal/privacy/privacy.html"));

// Components
router.get("/navbar", (req, res) => sendHtmlFile(res, "components/navbar.html"));

// Settings page
router.get("/settings", (req, res) => sendHtmlFile(res, "pages/settings/settings.html"));

// API routes
router.use('/api/forum', forumRoutes);
router.use("/api/messages", messagesRoutes);

module.exports = router;