import PropTypes from "prop-types";
import { RiRemoteControlLine } from "react-icons/ri";
import { Tabs } from "radix-ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AppIcon from "./assets/icon.png";
import BrowserBraveIcon from "./assets/Brave_Lion_Icon.svg";
import BrowserChromiumLogo from "./assets/Chromium_Logo.svg";
import BrowserGoogleChromeIcon from "./assets/Google_Chrome_Icon.svg";
import BrowserMicrosoftEdgeIcon from "./assets/Microsoft_Edge_Logo.svg";
import DefaultAvatar from "./assets/user.png";
import Input from "./components/Input";
import { cn, searchIncludes } from "./lib/utils";

const browsers = [
  {
    key: "chrome",
    name: "Chrome",
    icon: BrowserGoogleChromeIcon,
  },

  {
    key: "chromium",
    name: "Chromium",
    icon: BrowserChromiumLogo,
  },
  {
    key: "microsoft-edge",
    name: "Microsoft Edge",
    icon: BrowserMicrosoftEdgeIcon,
  },
  {
    key: "brave",
    name: "Brave",
    icon: BrowserBraveIcon,
  },
];

function Browser({ browserKey }) {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");

  const list = useMemo(
    () =>
      search
        ? profiles.filter((profile) => {
            return (
              searchIncludes(profile["name"], search) ||
              searchIncludes(profile["user_name"], search)
            );
          })
        : profiles,
    [search, profiles],
  );

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke("get-profiles", browserKey)
      .then(setProfiles);
  }, [browserKey]);

  return (
    <div className="flex flex-col gap-2 grow">
      <div className="px-4">
        <Input
          type="search"
          placeholder={"Search"}
          value={search}
          onChange={(ev) => setSearch(ev.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 grow overflow-auto px-4">
        {list.map((profile) => (
          <button
            key={profile.directory}
            onClick={() =>
              window.electron.ipcRenderer.send(
                "launch-profile",
                browserKey,
                profile.directory,
              )
            }
            className={cn(
              "bg-neutral-100 dark:bg-neutral-700",
              "hover:bg-orange-100 hover:text-orange-700",
              "dark:hover:bg-orange-200 dark:hover:text-orange-500",
              "min-w-0 flex items-center gap-2",
              "rounded-xl text-left",
              "group",
              "px-2 py-1",
            )}
          >
            <img
              src={
                profile["last_downloaded_gaia_picture_url_with_size"] ||
                DefaultAvatar
              }
              className="size-8 shrink-0 rounded-full"
              loading="lazy"
            />

            <div>
              <h3 className="font-bold">{profile.name || profile.directory}</h3>
              <h5
                className={cn(
                  "truncate",
                  "text-neutral-500 dark:text-neutral-400",
                  "group-hover:text-orange-900",
                )}
              >
                {profile["user_name"]}
              </h5>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

Browser.propTypes = {
  browserKey: PropTypes.string,
};

function BrowserButton({ active, browser }) {
  const ref = useRef();

  useEffect(() => {
    if (active) {
      ref.current.scrollIntoView({
        inline: "center",
        behavior: "smooth",
      });
    }
  }, [active]);
  return (
    <Tabs.Trigger
      ref={ref}
      key={browser.key}
      value={browser.key}
      className={cn(
        "data-[state=active]:bg-neutral-100 data-[state=active]:dark:bg-neutral-700",
        "p-1.5 rounded-full shrink-0",
        "flex gap-2 items-center",
        "cursor-pointer",
      )}
    >
      <img src={browser.icon} className="size-6 shrink-0 rounded-full" />
      <div className="truncate">{browser.name}</div>
    </Tabs.Trigger>
  );
}

function App() {
  const [tab, setTab] = useState(browsers[0].key);
  const [isRunning, setIsRunning] = useState(null);
  const [addresses, setAddresses] = useState(null);

  const handleStartServer = useCallback(() => {
    window.electron.ipcRenderer.invoke("start-server").then((addresses) => {
      setIsRunning(true);
      setAddresses(addresses);
    });
  }, [setAddresses, setIsRunning]);

  const handleStopServer = useCallback(() => {
    window.electron.ipcRenderer.invoke("stop-server").then(() => {
      setAddresses(null);
      setIsRunning(false);
    });
  }, []);

  /** Get Server State */
  useEffect(() => {
    window.electron.ipcRenderer
      .invoke("get-server-state")
      .then(({ status, addresses }) => {
        setIsRunning(status);
        setAddresses(addresses);
      });
  }, [setIsRunning, setAddresses]);

  return (
    <div className="flex flex-col gap-2 h-dvh py-4">
      <div className="px-4 flex gap-2 items-center">
        <div className="flex gap-2 items-center grow">
          <img src={AppIcon} className="size-8 shrink-0" />
          <h1 className="font-turret-road text-orange-500 text-2xl truncate">
            Purrfect Launcher
          </h1>
        </div>
        <button
          title="Toggle - Mirror Server"
          className={cn(
            "bg-neutral-100 dark:bg-neutral-700",
            "shrink-0 p-2 rounded-full",
            isRunning ? "text-green-500" : "text-red-500",
          )}
          onClick={!isRunning ? handleStartServer : handleStopServer}
        >
          <RiRemoteControlLine className="w-4 h-4" />
        </button>
      </div>
      <Tabs.Root
        value={tab}
        onValueChange={setTab}
        className="flex flex-col gap-2 grow"
      >
        <Tabs.List className="overflow-auto flex gap-1 flex-nowrap px-4 py-1">
          {browsers.map((browser) => (
            <BrowserButton
              key={browser.key}
              browser={browser}
              active={tab === browser.key}
            />
          ))}
        </Tabs.List>

        {browsers.map((browser) => (
          <Tabs.Content key={browser.key} value={browser.key} asChild>
            <Browser browserKey={browser.key} />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}

export default App;
