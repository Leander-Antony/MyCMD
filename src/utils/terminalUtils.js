/**
 * Terminal Utility Functions
 * Helper functions for URL handling, duplicate checking, and data validation
 */

/**
 * Normalize URL by adding https:// if protocol is missing
 * @param {string} str - The URL string to normalize
 * @returns {string} - Normalized URL with protocol
 */
export const normalizeURL = (str) => {
  if (!/^https?:\/\//i.test(str)) {
    return `https://${str}`;
  }
  return str;
};

/**
 * Check if a string is a URL by detecting protocol or domain extensions
 * @param {string} str - The string to check
 * @returns {boolean} - True if string appears to be a URL
 */
export const isURL = (str) => {
  // Check if it already has http/https protocol
  if (/^https?:\/\//i.test(str)) {
    return true;
  }
  // Check if it has domain extensions like .com, .org, .net, etc.
  return /\.[a-z]{2,}(\.[a-z]{2,})?$/i.test(str);
};

/**
 * Check for duplicate items in a category with smart URL comparison
 * @param {string} item - The item to check for duplicates
 * @param {string} category - The category to check in
 * @param {Object} data - The data object containing all categories
 * @returns {boolean} - True if duplicate exists
 */
export const isDuplicate = (item, category, data) => {
  if (!data[category]) return false;
  
  // For URLs, normalize both the new item and existing items for comparison
  if (isURL(item)) {
    const normalizedNewItem = normalizeURL(item);
    return data[category].some(existingItem => {
      const normalizedExisting = isURL(existingItem) ? normalizeURL(existingItem) : existingItem;
      return normalizedNewItem.toLowerCase() === normalizedExisting.toLowerCase();
    });
  }
  
  // For plain text, do case-insensitive comparison
  return data[category].some(existingItem => {
    return item.toLowerCase() === existingItem.toLowerCase();
  });
};

/**
 * Find autocomplete suggestion for terminal commands
 * @param {string} currentInput - Current input text
 * @param {Array} availableCommands - Array of available commands
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {string} - Autocomplete suggestion or empty string
 */
export const getAutoCompleteSuggestion = (currentInput, availableCommands, isAuthenticated) => {
  if (!currentInput || !isAuthenticated) return "";
  
  const trimmedInput = currentInput.trim().toLowerCase();
  if (trimmedInput === "") return "";
  
  // Find command that starts with the input
  const match = availableCommands.find(cmd => 
    cmd.toLowerCase().startsWith(trimmedInput) && cmd.toLowerCase() !== trimmedInput
  );
  
  if (match) {
    // Return the remaining part of the matched command
    return match.substring(trimmedInput.length);
  }
  
  return "";
};