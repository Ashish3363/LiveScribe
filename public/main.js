// const { app, BrowserWindow, ipcMain } = require("electron");
// const path = require("path");

// let overlayWindow;
// let mainWindow; 

// app.whenReady().then(() => {
//     createMainWindow();
// });

// const createMainWindow = () => {
//     mainWindow = new BrowserWindow({
//         width: 800,
//         height: 600,
//         webPreferences: {
//             nodeIntegration: false,
//             contextIsolation: true,
//             preload: path.join(__dirname, "preload.js"), // Load preload script
//         },
//     });

//     mainWindow.loadURL("http://localhost:3000"); // Change this for production
// };

// ipcMain.on("open-overlay", () => {
//     if (!overlayWindow) {
//         overlayWindow = new BrowserWindow({
//             frame: false,
//             alwaysOnTop: true,
//             transparent: true,
//             resizable: false,
//             hasShadow: false,
//             webPreferences: {
//                 //preload: path.join(__dirname, 'preload.js'),
//                 nodeIntegration: false,
//                 contextIsolation: true,
//                 preload: path.join(__dirname, "preload.js"),
//             },
//         });

//         overlayWindow.loadURL("http://localhost:3000/overlay"); // Load overlay component

//         // Initially make it click-through
//         overlayWindow.setIgnoreMouseEvents(true, { forward: true });

//         overlayWindow.on("closed", () => (overlayWindow = null));
//     }
// });

// ipcMain.on("close-overlay", () => {
//     if (overlayWindow) {
//         overlayWindow.close();
//         overlayWindow = null;
//         if (mainWindow) {
//             mainWindow.webContents.send("overlay-closed");
//         }
//     }
// });


// // Enable clicks (when mouse enters the overlay UI)
// ipcMain.on("enable-clicks", () => {
//     if (overlayWindow) {
//         overlayWindow.setIgnoreMouseEvents(false);
//     }
// });

// // Disable clicks (when mouse leaves the overlay UI)
// ipcMain.on("disable-clicks", () => {
//     if (overlayWindow) {
//         overlayWindow.setIgnoreMouseEvents(true, { forward: true });
//     }
// });



const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let overlayWindow;
let mainWindow;
let isOverlayOpen = false; // Track overlay state

app.whenReady().then(() => {
    createMainWindow();
});

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"), // Load preload script
        },
    });

    mainWindow.loadURL("http://localhost:3000"); // Change this for production

    mainWindow.on("close", (event) => {
        if (isOverlayOpen) {
            event.preventDefault(); // Prevent closing if overlay is open
        }
    });

    
    
};

ipcMain.on("open-overlay", () => {
    if (!overlayWindow) {
        overlayWindow = new BrowserWindow({
            frame: false,
            alwaysOnTop: true,
            transparent: true,
            resizable: false,
            hasShadow: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, "preload.js"),
            },
        });

        overlayWindow.loadURL("http://localhost:3000/overlay"); // Load overlay component
        overlayWindow.setIgnoreMouseEvents(true, { forward: true });

        isOverlayOpen = true; // Set overlay as open

        if (mainWindow) {
            mainWindow.webContents.send("overlay-status", true); // Notify renderer
        }

        overlayWindow.on("closed", () => {
            overlayWindow = null;
            isOverlayOpen = false;

            if (mainWindow) {
                mainWindow.webContents.send("overlay-status", false); // Notify renderer
            }
        });
    }
});

ipcMain.on("close-overlay", () => {
    if (overlayWindow) {
        overlayWindow.close();
        overlayWindow = null;
        isOverlayOpen = false;
        if (mainWindow) {
            mainWindow.webContents.send("overlay-closed");
        }
    }
});

// Enable clicks (when mouse enters the overlay UI)
ipcMain.on("enable-clicks", () => {
    if (overlayWindow) {
        overlayWindow.setIgnoreMouseEvents(false);
    }
});

// Disable clicks (when mouse leaves the overlay UI)
ipcMain.on("disable-clicks", () => {
    if (overlayWindow) {
        overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    }
});