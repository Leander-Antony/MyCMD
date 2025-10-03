import React, { useState, useEffect, useRef } from "react";
import "./Terminal.css";
import ElectricBorder from './ElectricBorder';
import MatrixRain from './MatrixRain';
import GlowDot from "./GlowDot";

export default function Terminal() {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [data, setData] = useState({});
  const [showHelp, setShowHelp] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [autoComplete, setAutoComplete] = useState("");
  const [sessionStart, setSessionStart] = useState(() => {
    const saved = localStorage.getItem("terminalSessionStart");
    return saved ? new Date(saved) : new Date();
  });
  const [commandCount, setCommandCount] = useState(() => {
    const saved = localStorage.getItem("terminalCommandCount");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [commandFrequency, setCommandFrequency] = useState(() => {
    const saved = localStorage.getItem("terminalCommandFrequency");
    return saved ? JSON.parse(saved) : {};
  });
  const [aliases, setAliases] = useState(() => {
    const saved = localStorage.getItem("terminalAliases");
    return saved ? JSON.parse(saved) : {};
  });
  const inputRef = useRef(null);
  const historyRef = useRef(null);

  // Available commands for autocomplete
  const availableCommands = [
    "help", "clear", "debug", "logout", "categories", "cats",
    "addcat", "removecat", "add", "remove",
    "stats", "uptime", "grep", "quote",
    "alias", "aliaslist", "removealias"
  ];

  // Function to find autocomplete suggestion
  const getAutoCompleteSuggestion = (currentInput) => {
    if (!currentInput || !isAuthenticated) return "";
    
    const trimmedInput = currentInput.trim().toLowerCase();
    if (trimmedInput === "") return "";
    
    // Find matching command
    const match = availableCommands.find(cmd => 
      cmd.toLowerCase().startsWith(trimmedInput) && cmd.toLowerCase() !== trimmedInput
    );
    
    return match ? match.substring(trimmedInput.length) : "";
  };

  // Update autocomplete when input changes
  useEffect(() => {
    const suggestion = getAutoCompleteSuggestion(input);
    setAutoComplete(suggestion);
  }, [input, isAuthenticated]);

  // Load stored data from localStorage on mount
  useEffect(() => {
    console.log("Loading data from localStorage...");
    
    const savedDataString = localStorage.getItem("terminalData");
    console.log("Raw localStorage data:", savedDataString);
    
    const saved = savedDataString ? JSON.parse(savedDataString) : {
      links: [],
      projects: [],
      courses: [],
    };
    
    console.log("Parsed data:", saved);
    setData(saved);
    setIsDataLoaded(true); // Mark data as loaded

    // Load authentication state
    const authStatus = localStorage.getItem("terminalAuth") === "true";
    setIsAuthenticated(authStatus);
    setShowHelp(authStatus);

    // Save session start time to localStorage if not already saved
    if (authStatus && !localStorage.getItem("terminalSessionStart")) {
      const newSessionStart = new Date();
      setSessionStart(newSessionStart);
      localStorage.setItem("terminalSessionStart", newSessionStart.toISOString());
    } else if (authStatus && localStorage.getItem("terminalSessionStart")) {
      // Update sessionStart state from localStorage if already authenticated
      const saved = localStorage.getItem("terminalSessionStart");
      setSessionStart(new Date(saved));
    }

    // Load command history
    const savedCommandHistory = localStorage.getItem("terminalCommandHistory");
    if (savedCommandHistory) {
      setCommandHistory(JSON.parse(savedCommandHistory));
    }

    // Initial banner
    setHistory([
      `Welcome to MyCMD!`,
      authStatus ? `Welcome back, master.` : `Enter the secret word to access the terminal...`
    ]);
  }, []);

  // Save data to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (isDataLoaded) {
      console.log("Saving data to localStorage:", data);
      localStorage.setItem("terminalData", JSON.stringify(data));
    }
  }, [data, isDataLoaded]);

  // Save command history to localStorage whenever it changes
  useEffect(() => {
    if (commandHistory.length > 0) {
      localStorage.setItem("terminalCommandHistory", JSON.stringify(commandHistory));
    }
  }, [commandHistory]);

  // Save command count to localStorage whenever it changes
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem("terminalCommandCount", commandCount.toString());
    }
  }, [commandCount, isAuthenticated]);

  // Save command frequency to localStorage whenever it changes
  useEffect(() => {
    if (isAuthenticated && Object.keys(commandFrequency).length > 0) {
      localStorage.setItem("terminalCommandFrequency", JSON.stringify(commandFrequency));
    }
  }, [commandFrequency, isAuthenticated]);

  // Save aliases to localStorage whenever they change
  useEffect(() => {
    if (isAuthenticated && Object.keys(aliases).length >= 0) {
      localStorage.setItem("terminalAliases", JSON.stringify(aliases));
    }
  }, [aliases, isAuthenticated]);

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  // Helper function to normalize links
  const normalizeURL = (str) => {
    if (!/^https?:\/\//i.test(str)) {
      return `https://${str}`;
    }
    return str;
  };

  // Helper function to check if a string is a URL (enhanced to detect domain extensions)
  const isURL = (str) => {
    // Check if it already has http/https protocol
    if (/^https?:\/\//i.test(str)) {
      return true;
    }
    // Check if it has domain extensions like .com, .org, .net, etc.
    return /\.[a-z]{2,}(\.[a-z]{2,})?$/i.test(str);
  };

  // Helper function to check for duplicates in a category
  const isDuplicate = (item, category) => {
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

  // Helper function to render items with clickable links
  const renderItems = (items, category) => {
    if (items.length === 0) return [`No ${category} stored yet.`];

    return items.map((item, i) => {
      // Check if item is a URL (in any category, not just "links")
      if (isURL(item)) {
        const fullUrl = normalizeURL(item);
        return (
          <div key={i} className="terminal-line">
            {`${i + 1}. `}
            <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="terminal-link">
              {item}
            </a>
          </div>
        );
      } else {
        return <div key={i} className="terminal-line">{`${i + 1}. ${item}`}</div>;
      }
    });
  };

  const handleCommand = (cmd) => {
    let command = cmd.trim();

    // Track command usage (but not for authentication command)
    if (isAuthenticated && command !== "zoro") {
      setCommandCount(prev => prev + 1);
      setCommandFrequency(prev => ({
        ...prev,
        [command]: (prev[command] || 0) + 1
      }));
    }

    // Check authentication first
    if (!isAuthenticated) {
      if (command === "zoro") {
        setIsAuthenticated(true);
        setShowHelp(true);
        localStorage.setItem("terminalAuth", "true");
        
        // Set session start time for new session
        const newSessionStart = new Date();
        setSessionStart(newSessionStart);
        localStorage.setItem("terminalSessionStart", newSessionStart.toISOString());
        
        setHistory(prev => [...prev, `Access granted. Welcome, master.`, `Type 'help' to see available commands.`]);
        return;
      } else {
        setHistory(prev => [...prev, `This is not yours, leave it at once!`]);
        return;
      }
    }

    if (command === "help") {
      setShowHelp(!showHelp);
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, showHelp ? 'Help panel hidden' : 'Help panel shown']);
      return;
    }

    if (command === "clear") {
      setHistory([]);
      return;
    }

    if (command === "debug") {
      const allStorageKeys = Object.keys(localStorage);
      const terminalKeys = allStorageKeys.filter(key => key.startsWith('terminal'));
      const debugInfo = [`=== DEBUG INFO ===`];
      
      // Show all terminal-related localStorage
      terminalKeys.forEach(key => {
        const value = localStorage.getItem(key);
        debugInfo.push(`${key}: ${value}`);
      });
      
      // Show aliases
      const aliases = JSON.parse(localStorage.getItem('terminalAliases') || '{}');
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
      return;
    }

    if (command === "logout") {
      setIsAuthenticated(false);
      setShowHelp(false);
      
      // Clear all session data from localStorage
      localStorage.removeItem("terminalAuth");
      localStorage.removeItem("terminalSessionStart");
      localStorage.removeItem("terminalCommandCount");
      localStorage.removeItem("terminalCommandFrequency");
      localStorage.removeItem("terminalCommandHistory");
      
      // Reset session statistics
      setCommandCount(0);
      setCommandFrequency({});
      setCommandHistory([]);
      
      // Reset session start time (fixes uptime not resetting on logout)
      setSessionStart(new Date());
      
      setHistory([
        `Welcome to MyCMD!`,
        `Session terminated. Enter the secret word to access the terminal...`
      ]);
      return;
    }



    // Statistics Commands
    if (command === "stats") {
      const uptime = Math.floor((new Date() - sessionStart) / 1000);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;
      
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
      return;
    }

    if (command === "uptime") {
      const uptime = Math.floor((new Date() - sessionStart) / 1000);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;
      
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`,
        `Session uptime: ${hours}h ${minutes}m ${seconds}s`,
        `Started: ${sessionStart.toLocaleTimeString()}`
      ]);
      return;
    }





    // Grep search command
    if (command.startsWith("grep")) {
      const searchTerm = command.substring(4).trim();
      if (!searchTerm) {
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`,
          `Usage: grep <search_term>`,
          `Search through all localStorage data, categories, and aliases`
        ]);
        return;
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
      return;
    }

    // Quote API command
    if (command === "quote") {
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
      return;
    }

    // Show available categories
    if (command === "categories" || command === "cats") {
      const categories = Object.keys(data);
      if (categories.length === 0) {
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `No categories found.`]);
      } else {
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, 
          `Available categories:`, 
          ...categories.map((cat, i) => `${i + 1}. ${cat} (${data[cat]?.length || 0} items)`)
        ]);
      }
      return;
    }

    // Add new category
    if (command.startsWith("addcat")) {
      const match = command.match(/addcat\s+\"(.+?)\"|addcat\s+(\w+)/);
      if (match) {
        const newCategory = match[1] || match[2];
        if (data[newCategory]) {
          setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Category "${newCategory}" already exists.`]);
        } else {
          setData({ ...data, [newCategory]: [] });
          setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Created category "${newCategory}".`]);
        }
        return;
      } else {
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Invalid syntax. Use: addcat "category" or addcat category`]);
        return;
      }
    }

    // Remove category
    if (command.startsWith("removecat")) {
      const match = command.match(/removecat\s+\"(.+?)\"|removecat\s+(\w+)/);
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
        return;
      } else {
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Invalid syntax. Use: removecat "category" or removecat category`]);
        return;
      }
    }

    // List items in any category (dynamic)
    if (Object.keys(data).includes(command)) {
      const items = data[command] || [];
      const rendered = renderItems(items, command);
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Stored ${command}:`, ...rendered]);
      return;
    }

    if (command.startsWith("add")) {
      const match = command.match(/add\s+\"(.+?)\"\s+in\s+(\w+)/);
      if (match) {
        let [, item, category] = match;
        if (!data[category]) data[category] = [];

        // Smart URL detection and normalization
        if (isURL(item)) {
          item = normalizeURL(item);
        }

        // Check for duplicates before adding
        if (isDuplicate(item, category)) {
          setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Duplicate detected! "${item}" already exists in ${category}`]);
          return;
        }

        setData({ ...data, [category]: [...data[category], item] });
        
        // Show different message for URLs vs plain text
        const itemType = isURL(item) ? "(detected as link)" : "(stored as text)";
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Added "${item}" in ${category} ${itemType}`]);
        return;
      } else {
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Invalid add syntax. Use: add "item" in category`]);
        return;
      }
    }

    // Alias commands (moved before remove to prevent conflicts)
    if (command.startsWith("alias ")) {
      const match = command.match(/alias\s+\"(.+?)\"\s+as\s+(\w+)/);
      if (match) {
        const [, url, aliasName] = match;
        
        // Check if alias already exists
        if (aliases[aliasName]) {
          setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Alias "${aliasName}" already exists. Use removealias to remove it first.`]);
          return;
        }
        
        // Normalize URL
        const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
        setAliases(prev => ({ ...prev, [aliasName]: normalizedUrl }));
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Created alias "${aliasName}" for ${normalizedUrl}`]);
        return;
      } else {
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Invalid alias syntax. Use: alias "url" as aliasname`]);
        return;
      }
    }

    if (command === "aliaslist") {
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
      return;
    }

    if (command.startsWith("removealias ")) {
      const aliasName = command.substring(12).trim();
      if (!aliasName) {
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Usage: removealias <aliasname>`]);
        return;
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
      return;
    }

    if (command.startsWith("remove")) {
      // Try to match ID-based removal first: remove 1 from links
      const idMatch = command.match(/remove\s+(\d+)\s+from\s+(\w+)/);
      if (idMatch) {
        const [, idStr, category] = idMatch;
        const id = parseInt(idStr);
        
        if (data[category] && data[category].length > 0) {
          if (id >= 1 && id <= data[category].length) {
            const itemToRemove = data[category][id - 1]; // Convert to 0-based index
            const newArr = data[category].filter((_, index) => index !== id - 1);
            setData({ ...data, [category]: newArr });
            setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Removed "${itemToRemove}" from ${category}`]);
          } else {
            setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Invalid ID. ${category} has ${data[category].length} items (1-${data[category].length})`]);
          }
        } else {
          setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `No items in ${category} to remove`]);
        }
        return;
      }

      // Try to match name-based removal: remove "item" from links
      const nameMatch = command.match(/remove\s+\"(.+?)\"\s+from\s+(\w+)/);
      if (nameMatch) {
        let [, item, category] = nameMatch;
        if (data[category]) {
          // For links category, try to match both original and normalized URL
          let itemToRemove = item;
          if (category === "links") {
            const normalizedItem = normalizeURL(item);
            // Check if the normalized version exists in the array
            if (data[category].includes(normalizedItem)) {
              itemToRemove = normalizedItem;
            }
          }
          
          const newArr = data[category].filter(x => x !== itemToRemove);
          if (newArr.length < data[category].length) {
            setData({ ...data, [category]: newArr });
            setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Removed "${itemToRemove}" from ${category}`]);
          } else {
            setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Item "${item}" not found in ${category}`]);
          }
          return;
        } else {
          setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Unknown category: ${category}`]);
          return;
        }
      } else {
        setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Invalid remove syntax. Use: remove "item" from links OR remove 1 from links`]);
        return;
      }
    }



    // Check if command is an alias
    if (aliases[command]) {
      window.open(aliases[command], "_blank");
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Opening ${aliases[command]} in new tab...`]);
      return;
    }

    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Unknown command: ${command}. Type 'help' for options.`]);
  };

  const handleKeyDown = (e) => {
    if (!isAuthenticated) return; // Only handle arrow keys when authenticated
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    } else if (e.key === 'ArrowRight') {
      // Accept autocomplete suggestion
      if (autoComplete && e.target.selectionStart === input.length) {
        e.preventDefault();
        setInput(input + autoComplete);
        setAutoComplete("");
      }
    } else if (e.key === 'Tab') {
      // Accept autocomplete suggestion with Tab key as well
      if (autoComplete) {
        e.preventDefault();
        setInput(input + autoComplete);
        setAutoComplete("");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() !== "") {
      const trimmedInput = input.trim();
      
      // Define sensitive commands that should never be stored in history
      const sensitiveCommands = ["zoro"];
      const isSensitiveCommand = sensitiveCommands.includes(trimmedInput.toLowerCase());
      
      // Add command to history only if authenticated and not a sensitive command
      const shouldAddToHistory = isAuthenticated && !isSensitiveCommand;
      
      if (shouldAddToHistory) {
        setCommandHistory(prev => {
          if (prev.length === 0 || prev[prev.length - 1] !== trimmedInput) {
            return [...prev, trimmedInput];
          }
          return prev;
        });
      }
      
      // Reset history navigation
      setHistoryIndex(-1);
      
      handleCommand(trimmedInput);
      setInput("");
    }
  };

  return (
    <>
      <GlowDot />
      {/* <MatrixRain /> */}
      <div className="terminal-container" onClick={() => inputRef.current.focus()}>
        <div className="terminal-history" ref={historyRef}>
          {history.map((line, i) => {
            if (React.isValidElement(line)) {
              return React.cloneElement(line, { key: i });
            }
            
            // Check if line contains command prompt
            if (typeof line === 'string' && line.startsWith('root@mycmd:~$ ')) {
              const promptText = 'root@mycmd:~$ ';
              const commandText = line.substring(promptText.length);
              return (
                <div key={i} className="command-line">
                  <span className="prompt">{promptText}</span>
                  <span className="command">{commandText}</span>
                </div>
              );
            }
            
            return <div key={i} className="terminal-line">{line}</div>;
          })}
        </div>
        <form onSubmit={handleSubmit} className="terminal-input-form">
          <span className="terminal-prompt">
            {isAuthenticated ? "root@mycmd:~$ " : "secret> "}
          </span>
          <div className="input-container">
            <input
              ref={inputRef}
              type={isAuthenticated ? "text" : "password"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="terminal-input"
              autoFocus
            />
            {isAuthenticated && autoComplete && (
              <span className="autocomplete-preview">
                {input}{autoComplete}
              </span>
            )}
          </div>
        </form>
      </div>
      
      {showHelp && isAuthenticated && (
        <ElectricBorder
          color="#00ff00"
          speed={1}
          chaos={0.5}
          thickness={2}
          style={{ 
            position: 'fixed',
            top: '20px',
            right: '20px',
            borderRadius: '16px',
            zIndex: 1000
          }}
        >
          <div className="help-panel">
            <h3>MyCMD Commands</h3>
            
            <div className="help-compact">
              <div className="help-row">
                <span className="cmd-category">SYSTEM:</span>
                <span>help • clear • logout • debug</span>
              </div>
              
              <div className="help-row">
                <span className="cmd-category">DATA:</span>
                <span>cats • addcat "name" • removecat "name"</span>
              </div>
              
              <div className="help-row">
                <span className="cmd-category">ITEMS:</span>
                <span>add "item" in [cat] • remove [id] from [cat]</span>
              </div>
              
              <div className="help-row">
                <span className="cmd-category">ALIASES:</span>
                <span>alias "url" as name • aliaslist • removealias</span>
              </div>
              
              <div className="help-row">
                <span className="cmd-category">TOOLS:</span>
                <span>grep [term] • stats • uptime • quote</span>
              </div>
            </div>
          </div>
        </ElectricBorder>
      )}
    </>
  );
}