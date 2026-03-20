import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Polyfill window.storage for standalone deployment (uses localStorage)
if (!window.storage) {
  window.storage = {
    get: async function(key) {
      var val = localStorage.getItem("cs_" + key);
      return val ? { value: val } : null;
    },
    set: async function(key, value) {
      localStorage.setItem("cs_" + key, typeof value === "string" ? value : JSON.stringify(value));
      return { key: key, value: value };
    },
    delete: async function(key) {
      localStorage.removeItem("cs_" + key);
      return { key: key, deleted: true };
    },
    list: async function(prefix) {
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.startsWith("cs_" + (prefix || ""))) keys.push(k.replace("cs_", ""));
      }
      return { keys: keys };
    }
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(App)
)
