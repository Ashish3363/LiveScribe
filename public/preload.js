const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    send: (channel, data) => ipcRenderer.send(channel, data),  // Fix: Expose `send`
    receive: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),  // Fix: Expose `receive`
    openOverlay: () => ipcRenderer.send("open-overlay"),
    closeOverlay: () => ipcRenderer.send("close-overlay"),
    enableClicks: () => ipcRenderer.send("enable-clicks"),
    disableClicks: () => ipcRenderer.send("disable-clicks"),

});


