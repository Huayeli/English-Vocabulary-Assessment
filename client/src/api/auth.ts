import { http } from "./http";

export interface PublicUser {
  id: number;
  username: string;
  email: string | null;
  avatar: string | null;
  role: string;
  packageCode: string;
  packageName: string;
}

export const authApi = {
  register: (data: { username: string; password: string; email?: string }) => http.post("/auth/register", data),
  login: (data: { username: string; password: string }) => http.post("/auth/login", data),
  sendEmailCode: (email: string) => http.post("/auth/email-code", { email }),
  loginByEmail: (data: { email: string; code: string }) => http.post("/auth/login-by-email", data),
  bindEmailCode: (email: string) => http.post("/auth/bind-email-code", { email }),
  bindEmail: (data: { email: string; code: string }) => http.post("/auth/bind-email", data),
  resetPasswordCode: (email: string) => http.post("/auth/reset-password-code", { email }),
  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    http.post("/auth/reset-password", data),
  me: () => http.get("/auth/me")
};
