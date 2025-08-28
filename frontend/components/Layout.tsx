
import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  FileText,
  Volume2,
  ScrollText,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import { useThemeStore } from "../lib/themeStore";

const links = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Proposal Generator", href: "/proposal-generator", icon: FileText },
  { name: "Voice Responder", href: "/voice-responder", icon: Volume2 },
  { name: "Contract Generator", href: "/contract-generator", icon: ScrollText },
];

const Sidebar: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(true);

  return (
    <aside
      className={clsx(
        "hidden md:flex bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex-shrink-0 flex-col transition-all duration-300 border-r border-gray-200 dark:border-gray-800",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <span
          className={clsx(
            "text-2xl font-bold transition-all duration-300",
            sidebarCollapsed && "hidden"
          )}
        >
          Freelancer Toolkit
        </span>
        <button
          className="ml-auto p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setSidebarCollapsed((c) => !c)}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
      <nav className="flex flex-col gap-2 px-2 mt-4">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.href}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-2 py-2.5 px-4 rounded transition duration-200 text-left font-medium",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                isActive ? "bg-blue-600 text-white font-bold" : "",
                sidebarCollapsed && "justify-center px-0"
              )
            }
          >
            <link.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            <span
              className={clsx(
                "transition-opacity duration-500 ease-in-out",
                sidebarCollapsed
                  ? "opacity-0 pointer-events-none w-0"
                  : "opacity-100 w-auto"
              )}
            >
              {link.name}
            </span>
          </NavLink>
        ))}
      </nav>
      <SidebarThemeToggle collapsed={sidebarCollapsed} />
    </aside>
  );
};

const MobileHeader: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <header className="md:hidden flex items-center justify-between p-4 bg-white text-gray-900 dark:bg-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800">
      <span className="text-xl font-bold">Freelancer Toolkit</span>
      <button aria-label="Open sidebar" onClick={() => setSidebarOpen(true)}>
        <Menu className="w-7 h-7" />
      </button>
      {sidebarOpen && <MobileSidebar onClose={() => setSidebarOpen(false)} />}
    </header>
  );
};

const MobileSidebar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 z-40 md:hidden">
      <div className="fixed left-0 top-0 h-full w-64 bg-white text-gray-900 dark:bg-gray-900 dark:text-white z-50 flex flex-col p-4 border-r border-gray-200 dark:border-gray-800">
        <span className="text-xl font-bold mb-4">Freelancer Toolkit</span>
        <nav className="flex flex-col gap-2">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.href}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-2 py-2.5 px-4 rounded transition duration-200 text-left font-medium",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  isActive ? "bg-blue-600 text-white font-bold" : ""
                )
              }
            >
              <link.icon className="w-5 h-5 mr-2" />
              {link.name}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto">
          <SidebarThemeToggle collapsed={false} />
        </div>
        <button
          className="mt-4 py-2 text-gray-300 hover:text-white"
          aria-label="Close sidebar"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

function SidebarThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, toggleTheme } = useThemeStore();
  const handleToggle = () => {
    toggleTheme();
  };

  return (
    <div className="mt-auto p-4 flex justify-center">
      <button
        onClick={handleToggle}
        className={clsx(
          "flex items-center gap-2 px-3 py-2 rounded transition-colors duration-300",
          theme === "dark"
            ? "bg-gray-200 hover:bg-gray-300 text-gray-900"
            : "bg-gray-800 hover:bg-gray-700 text-white"
        )}
        aria-label="Toggle light/dark mode"
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5 transition-transform duration-300" />
        ) : (
          <Moon className="w-5 h-5 transition-transform duration-300" />
        )}
        {!collapsed && (
          <span className="ml-2">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        )}
      </button>
    </div>
  );
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeInitialized, setThemeInitialized] = React.useState(false);

  useEffect(() => {
    const cleanup = useThemeStore.getState().initTheme();
    setThemeInitialized(true);
    // Set document title from env, fallback to default
    const appName = (import.meta as any).env?.VITE_APP_NAME || "Freelancer Toolkit";
    document.title = appName;
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  if (!themeInitialized) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <MobileHeader />
        <main className="flex-1 flex items-center justify-center p-4 md:p-10 overflow-y-auto">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default Layout;

const BottomNav: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white text-gray-900 dark:bg-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-800">
      <ul className="grid grid-cols-4 text-xs">
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center justify-center py-2 gap-1",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300"
              )
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Home</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/proposal-generator"
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center justify-center py-2 gap-1",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300"
              )
            }
          >
            <FileText className="w-5 h-5" />
            <span>Proposals</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/voice-responder"
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center justify-center py-2 gap-1",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300"
              )
            }
          >
            <Volume2 className="w-5 h-5" />
            <span>Voice</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/contract-generator"
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center justify-center py-2 gap-1",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300"
              )
            }
          >
            <ScrollText className="w-5 h-5" />
            <span>Contracts</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};
