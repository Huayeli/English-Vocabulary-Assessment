import axios from "axios";

const instance = axios.create({ baseURL: "/api" });

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

instance.interceptors.response.use(
  (res) => {
    if (res.data?.code !== 0) return Promise.reject(new Error(res.data?.message ?? "请求失败"));
    return res.data.data;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const http = instance as unknown as {
  get: <T = unknown>(url: string, config?: Record<string, unknown>) => Promise<T>;
  post: <T = unknown>(url: string, data?: unknown, config?: Record<string, unknown>) => Promise<T>;
  put: <T = unknown>(url: string, data?: unknown, config?: Record<string, unknown>) => Promise<T>;
  delete: <T = unknown>(url: string, config?: Record<string, unknown>) => Promise<T>;
};
