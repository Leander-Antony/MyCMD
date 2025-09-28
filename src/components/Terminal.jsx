import React, { useState, useEffect, useRef } from "react";
import "./Terminal.css";
import ElectricBorder from './ElectricBorder';
import MatrixRain from './MatrixRain';
import BackgroundEffects from "./GlowDot";

export default function Terminal() {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [data, setData] = useState({});
  const [showHelp, setShowHelp] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);

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

    // Check authentication first
    if (!isAuthenticated) {
      if (command === "zoro") {
        setIsAuthenticated(true);
        setShowHelp(true);
        localStorage.setItem("terminalAuth", "true");
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
      const rawData = localStorage.getItem("terminalData");
      const storedData = rawData ? JSON.parse(rawData) : null;
      const authStatus = localStorage.getItem("terminalAuth");
      
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, 
        `=== DEBUG INFO ===`,
        `Raw localStorage: ${rawData}`,
        `Parsed localStorage: ${JSON.stringify(storedData, null, 2)}`,
        `Auth status: ${authStatus}`,
        `Current React state: ${JSON.stringify(data, null, 2)}`,
        `Links count: ${data.links?.length || 0}`,
        `Projects count: ${data.projects?.length || 0}`,
        `Courses count: ${data.courses?.length || 0}`
      ]);
      return;
    }

    if (command === "logout") {
      setIsAuthenticated(false);
      setShowHelp(false);
      localStorage.removeItem("terminalAuth");
      setHistory([
        `Welcome to MyCMD!`,
        `Session terminated. Enter the secret word to access the terminal...`
      ]);
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
      <BackgroundEffects />
      {/* <MatrixRain /> */}
      <div className="terminal-container" onClick={() => inputRef.current.focus()}>
        <div className="terminal-history">
          {history.map((line, i) =>
            React.isValidElement(line)
              ? React.cloneElement(line, { key: i })
              : <div key={i} className="terminal-line">{line}</div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="terminal-input-form">
          <span className="terminal-prompt">
            {isAuthenticated ? "root@mycmd:~$ " : "secret> "}
          </span>
          <input
            ref={inputRef}
            type={isAuthenticated ? "text" : "password"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="terminal-input"
            autoFocus
          />
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
            <div className="help-section">
              <div className="section-title">SYSTEM</div>
              <div className="command-compact">help, clear, logout, debug</div>
            </div>
            
            <div className="help-section">
              <div className="section-title">CATEGORIES</div>
              <div className="command-compact">categories - list all</div>
              <div className="command-compact">addcat "name" - create</div>
              <div className="command-compact">removecat "name" - delete</div>
              <div className="command-compact">[category] - show items</div>
            </div>
            
            <div className="help-section">
              <div className="section-title">ITEMS</div>
              <div className="command-compact">add "item" in [category]</div>
              <div className="command-compact">remove [id] from [category]</div>
              <div className="command-compact">remove "name" from [category]</div>
            </div>
            
            <h3>MyCMD Commands</h3>
          </div>
        </ElectricBorder>
      )}
    </>
  );
}