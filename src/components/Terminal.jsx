import React, { useState, useEffect, useRef } from "react";
import "./Terminal.css";
import ElectricBorder from './ElectricBorder';
import MatrixRain from './MatrixRain';
import GlowDot from "./GlowDot";

// Import modular services and utilities
import {
  getAuthStatus,
  setAuthStatus,
  getSessionStart,
  setSessionStart as setStorageSessionStart,
  getCommandCount,
  setCommandCount as setStorageCommandCount,
  getCommandFrequency,
  setCommandFrequency as setStorageCommandFrequency,
  getCommandHistory,
  setCommandHistory as setStorageCommandHistory,
  getAliases,
  setAliases as setStorageAliases,
  getTerminalData,
  setTerminalData,
  clearAllTerminalData
} from '../services/localStorageService.js';

import { 
  getAutoCompleteSuggestion 
} from '../utils/terminalUtils.js';

import { 
  handleAliasCommands,
  getAliasCommands 
} from '../modules/aliasManager.js';

import { 
  handleUtilityCommands,
  getUtilityCommands 
} from '../modules/commandHandlers.js';

import { 
  handleDataCommands, 
  handleCategoryDisplay 
} from '../modules/dataManager.js';

export default function Terminal() {
  // UI State
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [autoComplete, setAutoComplete] = useState("");

  // Data State (using localStorage service)
  const [data, setData] = useState(() => getTerminalData());
  const [isAuthenticated, setIsAuthenticated] = useState(() => getAuthStatus());
  const [commandHistory, setCommandHistory] = useState(() => getCommandHistory());
  const [sessionStart, setSessionStart] = useState(() => getSessionStart() || new Date());
  const [commandCount, setCommandCount] = useState(() => getCommandCount());
  const [commandFrequency, setCommandFrequency] = useState(() => getCommandFrequency());
  const [aliases, setAliases] = useState(() => getAliases());

  // Refs
  const inputRef = useRef(null);
  const historyRef = useRef(null);

  // Available commands for autocomplete (using modular approach)
  const availableCommands = [
    ...getUtilityCommands(),
    ...getAliasCommands(),
    "logout", "categories", "cats", "addcat", "removecat", "add", "remove"
  ];

  // Update autocomplete when input changes
  useEffect(() => {
    const suggestion = getAutoCompleteSuggestion(input, availableCommands, isAuthenticated);
    setAutoComplete(suggestion);
  }, [input, isAuthenticated]);

  // Initialize component on mount
  useEffect(() => {
    console.log("Initializing Terminal component...");
    setIsDataLoaded(true);

    // Set up initial session if authenticated
    const authStatus = getAuthStatus();
    setShowHelp(authStatus);

    if (authStatus && !getSessionStart()) {
      const newSessionStart = new Date();
      setSessionStart(newSessionStart);
      setStorageSessionStart(newSessionStart);
    }

    // Initial banner
    setHistory([
      `Welcome to MyCMD!`,
      authStatus ? `Welcome back, master.` : `Enter the secret word to access the terminal...`
    ]);
  }, []);

  // Sync state with localStorage using the service
  useEffect(() => {
    if (isDataLoaded) {
      setTerminalData(data);
    }
  }, [data, isDataLoaded]);

  useEffect(() => {
    setStorageCommandHistory(commandHistory);
  }, [commandHistory]);

  useEffect(() => {
    if (isAuthenticated) {
      setStorageCommandCount(commandCount);
    }
  }, [commandCount, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && Object.keys(commandFrequency).length > 0) {
      setStorageCommandFrequency(commandFrequency);
    }
  }, [commandFrequency, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && Object.keys(aliases).length >= 0) {
      setStorageAliases(aliases);
    }
  }, [aliases, isAuthenticated]);

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

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
        setAuthStatus(true);
        
        // Set session start time for new session
        const newSessionStart = new Date();
        setSessionStart(newSessionStart);
        setStorageSessionStart(newSessionStart);
        
        setHistory(prev => [...prev, `Access granted. Welcome, master.`, `Type 'help' to see available commands.`]);
        return;
      } else {
        setHistory(prev => [...prev, `This is not yours, leave it at once!`]);
        return;
      }
    }

    // Handle help command
    if (command === "help") {
      setShowHelp(!showHelp);
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, showHelp ? 'Help panel hidden' : 'Help panel shown']);
      return;
    }

    // Handle utility commands (clear, debug, stats, uptime, grep, quote)
    const utilityContext = {
      sessionStart,
      commandCount,
      commandFrequency,
      data,
      aliases,
      setHistory
    };
    
    if (handleUtilityCommands(command, utilityContext)) {
      return;
    }

    // Handle alias commands (alias, aliaslist, removealias, and alias execution)
    if (handleAliasCommands(command, aliases, setAliases, setHistory)) {
      return;
    }

    // Handle logout command
    if (command === "logout") {
      setIsAuthenticated(false);
      setShowHelp(false);
      
      // Clear only session data, preserve user data (categories and aliases)
      setStorageCommandCount(0);
      setStorageCommandFrequency({});
      setStorageCommandHistory([]);
      setStorageSessionStart(null);
      setAuthStatus(false);
      
      // Reset all state
      setCommandCount(0);
      setCommandFrequency({});
      setCommandHistory([]);
      setSessionStart(new Date());
      
      setHistory([
        `Welcome to MyCMD!`,
        `Session terminated. Enter the secret word to access the terminal...`
      ]);
      return;
    }

    // Handle data management commands (categories, add, remove)
    if (handleDataCommands(command, data, setData, setHistory)) {
      return;
    }

    // Try to display category contents if command matches a category name
    if (handleCategoryDisplay(command, data, setHistory)) {
      return;
    }

    // Check if command is an alias
    if (aliases[command]) {
      window.open(aliases[command], "_blank");
      setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, `Opening ${aliases[command]} in new tab...`]);
      return;
    }

    setHistory(prev => [...prev, `root@mycmd:~$ ${command}`, { text: `Unknown command: ${command}. Type 'help' for options.`, className: 'terminal-error' }]);
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
            
            // Handle objects with text and className (for error messages)
            if (typeof line === 'object' && line.text && line.className) {
              return <div key={i} className={`terminal-line ${line.className}`}>{line.text}</div>;
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