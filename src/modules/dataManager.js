import { normalizeURL, isURL, isDuplicate } from '../utils/terminalUtils.js';

/**
 * Data Manager Module
 * Handles all data management commands: categories, add, remove
 */

/**
 * Handle all data-related commands
 * @param {string} command - The command to execute
 * @param {Object} data - Current data state
 * @param {Function} setData - Data state setter
 * @param {Function} setHistory - History state setter
 * @returns {boolean} - True if command was handled
 */
export function handleDataCommands(command, data, setData, setHistory) {
  // Categories command
  if (command === "categories" || command === "cats") {
    const dataKeys = Object.keys(data);
    if (dataKeys.length === 0) {
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, "No categories found. Use 'add \"item\" in category' to create one."]);
    } else {
      const categoriesDisplay = dataKeys.map((key, index) => {
        const count = data[key] ? data[key].length : 0;
        return `${index + 1}. ${key} (${count} items)`;
      }).join('\n');
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Available categories:\n${categoriesDisplay}`]);
    }
    return true;
  }

  // Add new category
  if (command.startsWith("addcat")) {
    const match = command.match(/addcat\s+"(.+?)"|addcat\s+(\w+)/);
    if (match) {
      const newCategory = match[1] || match[2];
      if (data[newCategory]) {
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Category "${newCategory}" already exists.`]);
      } else {
        setData({ ...data, [newCategory]: [] });
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Created category "${newCategory}".`]);
      }
      return true;
    } else {
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Invalid syntax. Use: addcat "category" or addcat category`]);
      return true;
    }
  }

  // Remove category
  if (command.startsWith("removecat")) {
    const match = command.match(/removecat\s+"(.+?)"|removecat\s+(\w+)/);
    if (match) {
      const categoryToRemove = match[1] || match[2];
      if (!data[categoryToRemove]) {
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Category "${categoryToRemove}" does not exist.`]);
      } else if (data[categoryToRemove].length > 0) {
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Cannot remove "${categoryToRemove}": contains ${data[categoryToRemove].length} items. Remove items first.`]);
      } else {
        const newData = { ...data };
        delete newData[categoryToRemove];
        setData(newData);
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Removed category "${categoryToRemove}".`]);
      }
      return true;
    } else {
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Invalid syntax. Use: removecat "category" or removecat category`]);
      return true;
    }
  }

  // Add command
  if (command.startsWith("add")) {
    const match = command.match(/add\s+"(.+?)"\s+in\s+(\w+)/);
    if (match) {
      let [, item, category] = match;
      if (!data[category]) data[category] = [];

      // Smart URL detection and normalization
      if (isURL(item)) {
        item = normalizeURL(item);
      }

      // Check for duplicates before adding
      if (isDuplicate(item, category, data)) {
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Duplicate detected! "${item}" already exists in ${category}`]);
        return true;
      }

      setData({ ...data, [category]: [...data[category], item] });
      
      // Show different message for URLs vs plain text
      const itemType = isURL(item) ? "(detected as link)" : "(stored as text)";
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Added "${item}" in ${category} ${itemType}`]);
      return true;
    } else {
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Invalid add syntax. Use: add "item" in category`]);
      return true;
    }
  }

  // Remove commands (both ID-based and name-based)
  if (command.startsWith("remove")) {
    // Try to match ID-based removal first: remove 1 from links
    const idMatch = command.match(/remove\s+(\d+)\s+from\s+(\w+)/);
    if (idMatch) {
      const [, idStr, category] = idMatch;
      const id = parseInt(idStr);
      
      if (data[category] && data[category].length > 0) {
        if (id >= 1 && id <= data[category].length) {
          const removedItem = data[category][id - 1];
          const updatedCategory = data[category].filter((_, index) => index !== id - 1);
          setData({ ...data, [category]: updatedCategory });
          setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Removed item #${id}: "${removedItem}" from ${category}`]);
        } else {
          setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Invalid ID. ${category} has ${data[category].length} items (use 1-${data[category].length})`]);
        }
      } else {
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Category "${category}" not found or is empty`]);
      }
      return true;
    }

    // Try name-based removal: remove "item" from category
    const nameMatch = command.match(/remove\s+"(.+?)"\s+from\s+(\w+)/);
    if (nameMatch) {
      const [, item, category] = nameMatch;
      if (data[category]) {
        const updatedCategory = data[category].filter(existingItem => {
          // Normalize both items for comparison
          const normalizedExisting = isURL(existingItem) ? normalizeURL(existingItem) : existingItem;
          const normalizedItem = isURL(item) ? normalizeURL(item) : item;
          return normalizedExisting !== normalizedItem;
        });
        
        if (updatedCategory.length === data[category].length) {
          setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Item "${item}" not found in ${category}`]);
        } else {
          setData({ ...data, [category]: updatedCategory });
          setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Removed "${item}" from ${category}`]);
        }
      } else {
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Category "${category}" not found`]);
      }
      return true;
    }

    // Invalid remove syntax
    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Invalid remove syntax. Use: remove "item" from category OR remove <number> from category`]);
    return true;
  }

  // Command not handled by this module
  return false;
}

/**
 * Handle category listing command (show items in a category)
 * @param {string} command - The command to execute
 * @param {Object} data - Current data state
 * @param {Function} setHistory - History state setter
 * @returns {boolean} - True if command was handled
 */
export function handleCategoryDisplay(command, data, setHistory) {
  // Check if command matches a category name
  const category = command.trim();
  if (data[category]) {
    if (data[category].length === 0) {
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Category "${category}" is empty`]);
    } else {
      const items = data[category].map((item, index) => {
        const itemType = isURL(item) ? "🔗" : "📝";
        return `${index + 1}. ${itemType} ${item}`;
      }).join('\n');
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Items in "${category}" (${data[category].length}):\n${items}`]);
    }
    return true;
  }
  
  return false;
}