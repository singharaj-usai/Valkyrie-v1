// server/functions/api/utils/escapeRegex.js

/**
 * Escapes special characters in a string for use in a RegEx pattern.
 * @param {string} string - The string to escape.
 * @returns {string} - The escaped string.
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegex;
