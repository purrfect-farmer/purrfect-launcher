import psList from "ps-list";
import { execFile } from "child_process";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const browsers = {
  chrome: {
    name: "Google Chrome",
    userDataDir: {
      win32: join(homedir(), "AppData/Local/Google/Chrome/User Data"),
      darwin: join(homedir(), "Library/Application Support/Google/Chrome"),
      linux: join(homedir(), ".config/google-chrome"),
    },
    exec: {
      win32: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      linux: "google-chrome-stable",
    },
  },
  chromium: {
    name: "Chromium",
    userDataDir: {
      win32: join(homedir(), "AppData/Local/Chromium/User Data"),
      darwin: join(homedir(), "Library/Application Support/Chromium"),
      linux: join(homedir(), ".config/chromium"),
    },
    exec: {
      win32: "C:\\Program Files\\Chromium\\Application\\chromium.exe",
      darwin: "/Applications/Chromium.app/Contents/MacOS/Chromium",
      linux: "chromium",
    },
  },
  brave: {
    name: "Brave",
    userDataDir: {
      win32: join(
        homedir(),
        "AppData/Local/BraveSoftware/Brave-Browser/User Data",
      ),
      darwin: join(
        homedir(),
        "Library/Application Support/BraveSoftware/Brave-Browser",
      ),
      linux: join(homedir(), ".config/BraveSoftware/Brave-Browser"),
    },
    exec: {
      win32:
        "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
      darwin: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
      linux: "brave-browser",
    },
  },
  edge: {
    name: "Microsoft Edge",
    userDataDir: {
      win32: join(homedir(), "AppData/Local/Microsoft/Edge/User Data"),
      darwin: join(homedir(), "Library/Application Support/Microsoft Edge"),
      linux: join(homedir(), ".config/microsoft-edge"),
    },
    exec: {
      win32:
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      darwin: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      linux: "microsoft-edge",
    },
  },
};

const platform = process.platform;

function getUserDataDir(browserKey) {
  return browsers[browserKey]?.userDataDir[platform] || null;
}

function getBrowserExec(browserKey) {
  return browsers[browserKey]?.exec[platform] || null;
}

export function getProfiles(browserKey) {
  const userDataDir = getUserDataDir(browserKey);
  if (!userDataDir) return [];

  const localStatePath = join(userDataDir, "Local State");
  if (!existsSync(localStatePath)) return [];

  try {
    const state = JSON.parse(readFileSync(localStatePath, "utf8"));
    const infoCache = state.profile?.info_cache || {};
    return Object.entries(infoCache).map(([directory, profile]) => ({
      ...profile,
      browserKey,
      directory,
      path: join(userDataDir, directory),
    }));
  } catch {
    return [];
  }
}

export async function getRunningProfiles(browserKey) {
  const execName = getBrowserExec(browserKey)
    ?.split(/[/\\]/)
    .pop()
    ?.toLowerCase();
  if (!execName) return [];

  const processes = await psList();
  return processes
    .filter(
      (p) =>
        p.name.toLowerCase().includes(execName) &&
        p.cmd.includes("--profile-directory="),
    )
    .map((p) => {
      const match = p.cmd.match(/--profile-directory=("[^"]+"|[^ ]+)/);
      return match ? match[1].replace(/"/g, "") : null;
    })
    .filter(Boolean);
}

export function launchProfile(browserKey, profileDir) {
  const execPath = getBrowserExec(browserKey);
  const userDataDir = getUserDataDir(browserKey);
  if (!execPath || !userDataDir) return;

  execFile(
    execPath,
    [`--user-data-dir=${userDataDir}`, `--profile-directory=${profileDir}`],
    {
      cwd: userDataDir,
    },
  );
}
