const express = require("express");
const path = require("path");
const { isAuthenticated, isNotAuthenticated } = require("../middleware/auth");

const router = express.Router();

router.get("/navbar.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/views/navbar.html"));
});

router.get("/login.html", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/views/login.html"));
});

router.get("/register.html", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/views/register.html"));
});

router.get("/search-results.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../client/views/search-results.html"));
});

module.exports = router;
