/**
 * Alias Management Module
 * Handles alias creation, listing, removal, and execution
 */

import { normalizeURL } from '../utils/terminalUtils.js';

/**
 * Handle alias creation command
 * @param {string} command - The full command string
 * @param {Object} aliases - Current aliases object
 * @param {Function} setAliases - Alias setter function
 * @param {Function} setHistory - History setter function
 * @returns {boolean} - Whether command was handled
 */
export const handleAliasCreation = (command, aliases, setAliases, setHistory) => {
  if (!command.startsWith("alias ")) return false;

  const match = command.match(/alias\s+\"(.+?)\"\s+as\s+(\w+)/);
  if (match) {
    const [, url, aliasName] = match;
    
    // Check if alias already exists
    if (aliases[aliasName]) {
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Alias "${aliasName}" already exists. Use removealias to remove it first.`]);
      return true;
    }
    
    // Normalize URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    setAliases(prev => ({ ...prev, [aliasName]: normalizedUrl }));
    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Created alias "${aliasName}" for ${normalizedUrl}`]);
    return true;
  } else {
    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, { text: `Invalid alias syntax. Use: alias "url" as aliasname`, className: 'terminal-error' }]);
    return true;
  }
};

/**
 * Handle alias listing command
 * @param {string} command - The full command string
 * @param {Object} aliases - Current aliases object
 * @param {Function} setHistory - History setter function
 * @returns {boolean} - Whether command was handled
 */
export const handleAliasList = (command, aliases, setHistory) => {
  if (command !== "aliaslist") return false;

  const aliasList = Object.keys(aliases);
  if (aliasList.length === 0) {
    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `No aliases found.`]);
  } else {
    const aliasEntries = aliasList.map((alias, i) => `${i + 1}. ${alias} -> ${aliases[alias]}`);
    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, 
      `Available aliases (${aliasList.length}):`, 
      ...aliasEntries
    ]);
  }
  return true;
};

/**
 * Handle alias removal command
 * @param {string} command - The full command string
 * @param {Object} aliases - Current aliases object
 * @param {Function} setAliases - Alias setter function
 * @param {Function} setHistory - History setter function
 * @returns {boolean} - Whether command was handled
 */
export const handleAliasRemoval = (command, aliases, setAliases, setHistory) => {
  if (!command.startsWith("removealias ")) return false;

  const aliasName = command.substring(12).trim();
  if (!aliasName) {
    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Usage: removealias <aliasname>`]);
    return true;
  }
  
  if (aliases[aliasName]) {
    const removedUrl = aliases[aliasName];
    const newAliases = { ...aliases };
    delete newAliases[aliasName];
    setAliases(newAliases);
    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Removed alias "${aliasName}" (${removedUrl})`]);
  } else {
    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Alias "${aliasName}" not found.`]);
  }
  return true;
};

/**
 * Handle alias execution (when user types an alias name)
 * @param {string} command - The command string (potential alias name)
 * @param {Object} aliases - Current aliases object
 * @param {Function} setHistory - History setter function
 * @returns {boolean} - Whether command was handled as an alias
 */
export const handleAliasExecution = (command, aliases, setHistory) => {
  if (aliases[command]) {
    window.open(aliases[command], "_blank");
    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Opening ${aliases[command]} in new tab...`]);
    return true;
  }
  return false;
};

/**
 * Main alias command handler that routes to appropriate sub-handlers
 * @param {string} command - The full command string
 * @param {Object} aliases - Current aliases object
 * @param {Function} setAliases - Alias setter function
 * @param {Function} setHistory - History setter function
 * @returns {boolean} - Whether command was handled by any alias function
 */
export const handleAliasCommands = (command, aliases, setAliases, setHistory) => {
  // Try each alias command handler in order
  return (
    handleAliasCreation(command, aliases, setAliases, setHistory) ||
    handleAliasList(command, aliases, setHistory) ||
    handleAliasRemoval(command, aliases, setAliases, setHistory) ||
    handleAliasExecution(command, aliases, setHistory)
  );
};

/**
 * Get array of alias-related commands for autocomplete
 * @returns {Array} - Array of alias command strings
 */
export const getAliasCommands = () => {
  return ["alias", "aliaslist", "removealias"];
};