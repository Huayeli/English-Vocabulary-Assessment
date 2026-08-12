import { http } from "./http";

export const adminApi = {
  users: (params: Record<string, unknown>) =>
    http.get<{ list: any[]; total: number; page: number; pageSize: number }>("/admin/users", { params }),
  setPackage: (id: number, data: Record<string, unknown>) => http.put(`/admin/users/${id}/package`, data),
  questions: (params: Record<string, unknown>) =>
    http.get<{ list: any[]; total: number; page: number; pageSize: number }>("/admin/questions", { params }),
  createQuestion: (data: Record<string, unknown>) => http.post("/admin/questions", data),
  updateQuestion: (id: number, data: Record<string, unknown>) => http.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id: number) => http.delete(`/admin/questions/${id}`),
  stats: () => http.get<any>("/admin/stats/overview")
};
