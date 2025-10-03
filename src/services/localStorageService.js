/**
 * LocalStorage Service
 * Centralized service for all localStorage operations in the terminal
 */

// Keys used for localStorage
export const STORAGE_KEYS = {
  AUTH: "terminalAuth",
  SESSION_START: "terminalSessionStart",
  COMMAND_COUNT: "terminalCommandCount",
  COMMAND_FREQUENCY: "terminalCommandFrequency",
  COMMAND_HISTORY: "terminalCommandHistory",
  ALIASES: "terminalAliases",
  DATA: "terminalData"
};

/**
 * Get item from localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} - Parsed value or default
 */
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Set item in localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} - Success status
 */
export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Error writing to localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Error removing localStorage key "${key}":`, error);
  }
};

/**
 * Clear all terminal-related data from localStorage
 */
export const clearAllTerminalData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeStorageItem(key);
  });
};

/**
 * Get authentication status
 * @returns {boolean} - Whether user is authenticated
 */
export const getAuthStatus = () => {
  return localStorage.getItem(STORAGE_KEYS.AUTH) === "true";
};

/**
 * Set authentication status
 * @param {boolean} isAuthenticated - Auth status
 */
export const setAuthStatus = (isAuthenticated) => {
  if (isAuthenticated) {
    localStorage.setItem(STORAGE_KEYS.AUTH, "true");
  } else {
    removeStorageItem(STORAGE_KEYS.AUTH);
  }
};

/**
 * Get session start time
 * @returns {Date|null} - Session start date or null
 */
export const getSessionStart = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.SESSION_START);
  return saved ? new Date(saved) : null;
};

/**
 * Set session start time
 * @param {Date} date - Session start date
 */
export const setSessionStart = (date) => {
  localStorage.setItem(STORAGE_KEYS.SESSION_START, date.toISOString());
};

/**
 * Get command count
 * @returns {number} - Command count
 */
export const getCommandCount = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.COMMAND_COUNT);
  return saved ? parseInt(saved, 10) : 0;
};

/**
 * Set command count
 * @param {number} count - Command count
 */
export const setCommandCount = (count) => {
  localStorage.setItem(STORAGE_KEYS.COMMAND_COUNT, count.toString());
};

/**
 * Get command frequency data
 * @returns {Object} - Command frequency object
 */
export const getCommandFrequency = () => {
  return getStorageItem(STORAGE_KEYS.COMMAND_FREQUENCY, {});
};

/**
 * Set command frequency data
 * @param {Object} frequency - Command frequency object
 */
export const setCommandFrequency = (frequency) => {
  setStorageItem(STORAGE_KEYS.COMMAND_FREQUENCY, frequency);
};

/**
 * Get command history
 * @returns {Array} - Command history array
 */
export const getCommandHistory = () => {
  return getStorageItem(STORAGE_KEYS.COMMAND_HISTORY, []);
};

/**
 * Set command history
 * @param {Array} history - Command history array
 */
export const setCommandHistory = (history) => {
  setStorageItem(STORAGE_KEYS.COMMAND_HISTORY, history);
};

/**
 * Get aliases
 * @returns {Object} - Aliases object
 */
export const getAliases = () => {
  return getStorageItem(STORAGE_KEYS.ALIASES, {});
};

/**
 * Set aliases
 * @param {Object} aliases - Aliases object
 */
export const setAliases = (aliases) => {
  setStorageItem(STORAGE_KEYS.ALIASES, aliases);
};

/**
 * Get terminal data
 * @returns {Object} - Terminal data object
 */
export const getTerminalData = () => {
  return getStorageItem(STORAGE_KEYS.DATA, {});
};

/**
 * Set terminal data
 * @param {Object} data - Terminal data object
 */
export const setTerminalData = (data) => {
  setStorageItem(STORAGE_KEYS.DATA, data);
};