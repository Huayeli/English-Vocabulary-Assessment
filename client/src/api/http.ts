import axios from "axios";

const instance = axios.create({ baseURL: "/api" });

instance.interceptors.request.use((config) => {
  const accessCode = localStorage.getItem("accessCode");
  if (accessCode) config.headers["X-Access-Code"] = accessCode;
  const adminKey = localStorage.getItem("adminKey");
  if (adminKey) config.headers["X-Admin-Key"] = adminKey;
  return config;
});

instance.interceptors.response.use(
  (res) => {
    if (res.data?.code !== 0) return Promise.reject(new Error(res.data?.message ?? "请求失败"));
    return res.data.data;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("accessCode");
      window.location.href = "/access";
    }
    const message = err.response?.data?.message ?? err.message ?? "请求失败";
    const e = new Error(message);
    (e as Error & { code?: number }).code = err.response?.data?.code;
    return Promise.reject(e);
  }
);

export const http = instance as unknown as {
  get: <T = unknown>(url: string, config?: Record<string, unknown>) => Promise<T>;
  post: <T = unknown>(url: string, data?: unknown, config?: Record<string, unknown>) => Promise<T>;
  put: <T = unknown>(url: string, data?: unknown, config?: Record<string, unknown>) => Promise<T>;
  delete: <T = unknown>(url: string, config?: Record<string, unknown>) => Promise<T>;
};
