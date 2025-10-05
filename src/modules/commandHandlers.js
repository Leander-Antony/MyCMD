/**
 * Terminal Command Handlers Module
 * Handles analytics, utility, and system commands
 */

/**
 * Format uptime into readable string
 * @param {Date} sessionStart - Session start time
 * @returns {Object} - Formatted uptime object with hours, minutes, seconds
 */
const formatUptime = (sessionStart) => {
  const uptime = Math.floor((new Date() - sessionStart) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;
  return { hours, minutes, seconds, totalSeconds: uptime };
};

/**
 * Handle stats command
 * @param {string} command - Command string
 * @param {Date} sessionStart - Session start time
 * @param {number} commandCount - Total command count
 * @param {Object} commandFrequency - Command frequency object
 * @param {Function} setHistory - History setter function
 * @returns {boolean} - Whether command was handled
 */
export const handleStatsCommand = (command, sessionStart, commandCount, commandFrequency, setHistory) => {
  if (command !== "stats") return false;

  const { hours, minutes, seconds } = formatUptime(sessionStart);
  
  const mostUsed = Object.entries(commandFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([cmd, count]) => `${cmd}: ${count} times`);

  setHistory(prev => [...prev, `root@mycmd:~$ ${command}`,
    `=== SESSION STATISTICS ===`,
    `Uptime: ${hours}h ${minutes}m ${seconds}s`,
    `Commands executed: ${commandCount}`,
    `Most used commands:`,
    ...mostUsed.length > 0 ? mostUsed : ['  No commands executed yet']
  ]);
  return true;
};

/**
 * Handle uptime command
 * @param {string} command - Command string
 * @param {Date} sessionStart - Session start time
 * @param {Function} setHistory - History setter function
 * @returns {boolean} - Whether command was handled
 */
export const handleUptimeCommand = (command, sessionStart, setHistory) => {
  if (command !== "uptime") return false;

  const { hours, minutes, seconds } = formatUptime(sessionStart);
  
  setHistory(prev => [...prev, `root@mycmd:~$ ${command}`,
    `Session uptime: ${hours}h ${minutes}m ${seconds}s`,
    `Started: ${sessionStart.toLocaleTimeString()}`
  ]);
  return true;
};

/**
 * Handle debug command
 * @param {string} command - Command string
 * @param {Object} data - Terminal data object
 * @param {Object} aliases - Aliases object
 * @param {Function} setHistory - History setter function
 * @returns {boolean} - Whether command was handled
 */
export const handleDebugCommand = (command, data, aliases, setHistory) => {
  if (command !== "debug") return false;

  const allStorageKeys = Object.keys(localStorage);
  const terminalKeys = allStorageKeys.filter(key => key.startsWith('terminal'));
  const debugInfo = [`=== DEBUG INFO ===`];
  
  // Show all terminal-related localStorage
  terminalKeys.forEach(key => {
    const value = localStorage.getItem(key);
    debugInfo.push(`${key}: ${value}`);
  });
  
  // Show aliases
  debugInfo.push(`Aliases: ${JSON.stringify(aliases, null, 2)}`);
  
  // Show current data state
  debugInfo.push(`Current data state: ${JSON.stringify(data, null, 2)}`);
  
  // Show localStorage usage
  let totalSize = 0;
  allStorageKeys.forEach(key => {
    totalSize += localStorage.getItem(key).length;
  });
  debugInfo.push(`Total localStorage size: ${(totalSize / 1024).toFixed(2)} KB`);
  
  setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, ...debugInfo]);
  return true;
};

/**
 * Handle grep search command
 * @param {string} command - Command string
 * @param {Object} data - Terminal data object
 * @param {Function} setHistory - History setter function
 * @returns {boolean} - Whether command was handled
 */
export const handleGrepCommand = (command, data, setHistory) => {
  if (!command.startsWith("grep")) return false;

  const searchTerm = command.substring(4).trim();
  if (!searchTerm) {
    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`,
      `Usage: grep <search_term>`,
      `Search through all localStorage data, categories, and aliases`
    ]);
    return true;
  }

  const results = [];
  const searchTermLower = searchTerm.toLowerCase();
  
  // Search in categories and items
  Object.entries(data).forEach(([category, items]) => {
    // Search category name
    if (category.toLowerCase().includes(searchTermLower)) {
      results.push(`Category: ${category}`);
    }
    // Search items in category
    if (Array.isArray(items)) {
      items.forEach((item, index) => {
        if (item.toLowerCase().includes(searchTermLower)) {
          results.push(`${category}[${index + 1}]: ${item}`);
        }
      });
    }
  });
  
  // Search in aliases
  const aliases = JSON.parse(localStorage.getItem('terminalAliases') || '{}');
  Object.entries(aliases).forEach(([aliasName, url]) => {
    if (aliasName.toLowerCase().includes(searchTermLower) || url.toLowerCase().includes(searchTermLower)) {
      results.push(`Alias: ${aliasName} -> ${url}`);
    }
  });
  
  // Search in command history
  const commandHistory = JSON.parse(localStorage.getItem('terminalHistory') || '[]');
  commandHistory.forEach((cmd, index) => {
    if (cmd.toLowerCase().includes(searchTermLower)) {
      results.push(`History[${index + 1}]: ${cmd}`);
    }
  });

  if (results.length === 0) {
    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`,
      `No results found for "${searchTerm}"`
    ]);
  } else {
    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`,
      `Found ${results.length} result(s) for "${searchTerm}":`,
      ...results
    ]);
  }
  return true;
};

/**
 * Handle quote command with API fallback
 * @param {string} command - Command string
 * @param {Function} setHistory - History setter function
 * @returns {boolean} - Whether command was handled
 */
export const handleQuoteCommand = (command, setHistory) => {
  if (command !== "quote") return false;

  setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Fetching quote from web...`]);
  
  // Local fallback quotes array
  const localQuotes = [
    { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { content: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { content: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
    { content: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { content: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
    { content: "In order to be irreplaceable, one must always be different.", author: "Coco Chanel" },
    { content: "Java is to JavaScript what car is to Carpet.", author: "Chris Heilmann" },
    { content: "Knowledge is power.", author: "Francis Bacon" },
    { content: "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code.", author: "Dan Salomon" },
    { content: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
    { content: "Ruby is rubbish! PHP is phpantastic!", author: "Nikita Popov" },
    { content: "Code never lies, comments sometimes do.", author: "Ron Jeffries" },
    { content: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { content: "Programming isn't about what you know; it's about what you can figure out.", author: "Chris Pine" },
    { content: "The best error message is the one that never shows up.", author: "Thomas Fuchs" }
  ];
  
  // Using a simple, reliable API that works in all environments
  fetch('https://api.adviceslip.com/advice')
    .then(response => response.json())
    .then(data => {
      setHistory(prev => [...prev,
        `"${data.slip.advice}"`,
        `— Daily Wisdom`,
      ]);
    })
    .catch(error => {
      console.log('API Error:', error);
      // Try alternative simple API
      fetch('https://api.quotable.io/random')
        .then(response => response.json())
        .then(quote => {
          setHistory(prev => [...prev,
            `"${quote.content}"`,
            `— ${quote.author}`,
          ]);
        })
        .catch(secondError => {
          console.log('Both APIs failed:', secondError);
          // Display random local quote instead of error
          const randomQuote = localQuotes[Math.floor(Math.random() * localQuotes.length)];
          setHistory(prev => [...prev,
            `"${randomQuote.content}"`,
            `— ${randomQuote.author}`,
            `(offline quote)`
          ]);
        });
    });
  return true;
};

/**
 * Handle export command - downloads all user data as JSON
 * @param {string} command - Command string
 * @param {Object} data - Categories data
 * @param {Object} aliases - Aliases data
 * @param {Function} setHistory - History setter function
 * @returns {boolean} - Whether command was handled
 */
export const handleExportCommand = (command, data, aliases, setHistory) => {
  if (command !== "export") return false;

  try {
    // Create export data object
    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      data: {
        categories: data,
        aliases: aliases
      }
    };

    // Create JSON string
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `mycmd-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    URL.revokeObjectURL(url);

    const categoriesCount = Object.keys(data).length;
    const aliasesCount = Object.keys(aliases).length;
    
    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`,
      `✓ Export successful!`,
      `  ${categoriesCount} categories exported`,
      `  ${aliasesCount} aliases exported`,
      `  Downloaded: mycmd-backup-${new Date().toISOString().split('T')[0]}.json`
    ]);
    
  } catch (error) {
    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`,
      { text: `✗ Export failed: ${error.message}`, className: 'terminal-error' }
    ]);
  }
  
  return true;
};

/**
 * Handle import command - accepts file upload to restore data
 * @param {string} command - Command string
 * @param {Object} data - Current categories data
 * @param {Object} aliases - Current aliases data
 * @param {Function} setData - Data setter function
 * @param {Function} setAliases - Aliases setter function
 * @param {Function} setHistory - History setter function
 * @returns {boolean} - Whether command was handled
 */
export const handleImportCommand = (command, data, aliases, setData, setAliases, setHistory) => {
  if (command !== "import") return false;

  // Create file input element
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  
  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setHistory(prev => [...prev, 
        { text: `✗ No file selected`, className: 'terminal-error' }
      ]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        
        // Validate import data structure
        if (!importData.data || !importData.data.categories || !importData.data.aliases) {
          throw new Error('Invalid backup file format');
        }

        // Merge or replace data based on user preference
        const newCategories = { ...data, ...importData.data.categories };
        const newAliases = { ...aliases, ...importData.data.aliases };
        
        setData(newCategories);
        setAliases(newAliases);

        const categoriesCount = Object.keys(importData.data.categories).length;
        const aliasesCount = Object.keys(importData.data.aliases).length;
        
        setHistory(prev => [...prev,
          `✓ Import successful!`,
          `  ${categoriesCount} categories imported`,
          `  ${aliasesCount} aliases imported`,
          `  Backup from: ${new Date(importData.timestamp).toLocaleString()}`,
          `  Note: Existing data was merged with imported data`
        ]);
        
      } catch (error) {
        setHistory(prev => [...prev,
          { text: `✗ Import failed: ${error.message}`, className: 'terminal-error' },
          `  Make sure you're uploading a valid MyCMD backup file`
        ]);
      }
    };
    
    reader.readAsText(file);
    document.body.removeChild(fileInput);
  };

  // Trigger file selection
  document.body.appendChild(fileInput);
  fileInput.click();
  
  setHistory(prev => [...prev, `root@mycmd:~$ ${command}`,
    `→ Select your MyCMD backup file (.json)...`
  ]);
  
  return true;
};

/**
 * Handle clear command
 * @param {string} command - Command string
 * @param {Function} setHistory - History setter function
 * @returns {boolean} - Whether command was handled
 */
export const handleClearCommand = (command, setHistory) => {
  if (command !== "clear") return false;
  setHistory([]);
  return true;
};

/**
 * Main utility command handler that routes to appropriate sub-handlers
 * @param {string} command - Command string
 * @param {Object} context - Context object with all necessary data and functions
 * @returns {boolean} - Whether command was handled
 */
export const handleUtilityCommands = (command, context) => {
  const {
    sessionStart,
    commandCount,
    commandFrequency,
    data,
    aliases,
    setData,
    setAliases,
    setHistory
  } = context;

  return (
    handleClearCommand(command, setHistory) ||
    handleDebugCommand(command, data, aliases, setHistory) ||
    handleStatsCommand(command, sessionStart, commandCount, commandFrequency, setHistory) ||
    handleUptimeCommand(command, sessionStart, setHistory) ||
    handleGrepCommand(command, data, setHistory) ||
    handleQuoteCommand(command, setHistory) ||
    handleExportCommand(command, data, aliases, setHistory) ||
    handleImportCommand(command, data, aliases, setData, setAliases, setHistory)
  );
};

/**
 * Get array of utility commands for autocomplete
 * @returns {Array} - Array of utility command strings
 */
export const getUtilityCommands = () => {
  return ["help", "clear", "debug", "stats", "uptime", "grep", "quote", "export", "import"];
};