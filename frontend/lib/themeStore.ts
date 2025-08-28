import { create } from "zustand";

type ThemeState = {
    theme: "light" | "dark";
    toggleTheme: () => void;
    syncTheme: () => void;
    initTheme: () => void | (() => void);
};

export const useThemeStore = create<ThemeState>((set, get) => ({
    theme: "light",
    toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === "light" ? "dark" : "light";
        set({ theme: newTheme });
        if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("theme", newTheme);
    },
    syncTheme: () => {
        const stored = localStorage.getItem("theme") as "light" | "dark" | null;
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const theme = stored || (systemPrefersDark ? "dark" : "light");
        set({ theme });
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    },
    initTheme: () => {
        get().syncTheme();
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e: MediaQueryListEvent) => {
            const stored = localStorage.getItem("theme");
            if (!stored) {
                const newTheme = e.matches ? "dark" : "light";
                set({ theme: newTheme });
                if (newTheme === "dark") {
                    document.documentElement.classList.add("dark");
                } else {
                    document.documentElement.classList.remove("dark");
                }
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    },
}));