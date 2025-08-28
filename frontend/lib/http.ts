import axios from "axios";

const normalizeBaseURL = (v?: string): string => {
    let u = (v ?? "").toString().trim();
    if (!u) return "/api";
    if (/^https?:\/\//i.test(u)) {
        u = u.replace(/\/+$/, "");
        if (!/\/api$/i.test(u)) u += "/api";
        return u;
    }
    if (!u.startsWith("/")) u = "/" + u;
    u = u.replace(/\/+$/, "");
    if (!u.startsWith("/api")) u = "/api";
    return u;
};

const baseURL = normalizeBaseURL((import.meta as any).env?.VITE_API_BASE_URL);

export const http = axios.create({
    baseURL,
    timeout: 60000,
    headers: {
        "Content-Type": "application/json",
    },
});

http.interceptors.response.use(
    (response) => response,
    (error) => {
        const status: number | undefined = error?.response?.status;
        const message: string = error?.response?.data?.detail || error?.message || "Request failed";
        return Promise.reject({ status, message });
    },
);
