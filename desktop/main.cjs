const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const DEFAULT_CONFIG = {
  TMDB_API_KEY: "",
  TMDB_API_URL: "https://api.themoviedb.org/3",
  TMDB_IMAGE_URL: "https://image.tmdb.org/t/p",
  VIDSRC_BASE_URL: "https://vidsrc.cc/v2/embed",
  VIDLINK_BASE_URL: "https://vidlink.pro",
  MOVIES111_BASE_URL: "https://111movies.com",
  EMBED2_BASE_URL: "https://www.2embed.cc",
  DATABASE_URL: "",
};

let serverProcess;

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getUserDataPaths() {
  const userData = process.env.APP_USER_DATA_PATH || app.getPath("userData");
  const configPath = process.env.APP_CONFIG_PATH || path.join(userData, "config.json");
  const dbPath = process.env.APP_DB_PATH || path.join(userData, "streamium.db");
  return { userData, configPath, dbPath };
}

function getDbTemplatePath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "streamium.db");
  }
  return path.join(app.getAppPath(), "desktop", "assets", "streamium.db");
}

function ensureDatabase(dbPath) {
  if (fs.existsSync(dbPath)) return;
  const templatePath = getDbTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing DB template at ${templatePath}`);
  }
  fs.copyFileSync(templatePath, dbPath);
}

function loadConfig(configPath, dbPath) {
  const defaults = {
    ...DEFAULT_CONFIG,
    DATABASE_URL: `file:${dbPath}`,
  };

  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(defaults, null, 2));
    return defaults;
  }

  const raw = fs.readFileSync(configPath, "utf8");
  let stored = {};
  try {
    stored = JSON.parse(raw);
  } catch {
    stored = {};
  }

  const merged = {
    ...defaults,
    ...stored,
  };

  if (!merged.DATABASE_URL) {
    merged.DATABASE_URL = `file:${dbPath}`;
  }

  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2));
  return merged;
}

function applyConfigToEnv(config, paths) {
  process.env.APP_DESKTOP = "true";
  process.env.APP_USER_DATA_PATH = paths.userData;
  process.env.APP_CONFIG_PATH = paths.configPath;
  process.env.APP_DB_PATH = paths.dbPath;

  Object.entries(config).forEach(([key, value]) => {
    if (typeof value === "string") {
      process.env[key] = value;
    }
  });
}

function waitForServer(url, timeoutMs = 15000) {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error("Server did not start in time"));
          return;
        }
        setTimeout(attempt, 300);
      });
    };

    attempt();
  });
}

function startServer() {
  const serverPath = path.join(app.getAppPath(), "server.js");
  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: "5173",
      ELECTRON_RUN_AS_NODE: "1",
    },
    cwd: app.getAppPath(),
    stdio: "inherit",
  });
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Disallow any new windows/tabs from the renderer.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const currentUrl = mainWindow.webContents.getURL();
    if (currentUrl && url !== currentUrl) {
      event.preventDefault();
    }
  });

  const devUrl = process.env.ELECTRON_DEV_SERVER_URL;
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
    return;
  }

  startServer();
  await waitForServer("http://127.0.0.1:5173");
  await mainWindow.loadURL("http://127.0.0.1:5173");
}

app.whenReady().then(() => {
  const paths = getUserDataPaths();
  ensureDir(paths.userData);
  ensureDatabase(paths.dbPath);
  const config = loadConfig(paths.configPath, paths.dbPath);
  applyConfigToEnv(config, paths);

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (serverProcess) {
      serverProcess.kill();
    }
    app.quit();
  }
});
