import { http } from "./http";

export const adminApi = {
  dashboard: () => http.get<any>("/admin/dashboard"),
  codes: (params: Record<string, unknown>) =>
    http.get<{ list: any[]; total: number; page: number; pageSize: number }>("/admin/codes", { params }),
  generateCodes: (data: Record<string, unknown>) => http.post<any>("/admin/codes/generate", data),
  updateCode: (id: number, data: Record<string, unknown>) => http.put(`/admin/codes/${id}`, data),
  batchCodes: (data: Record<string, unknown>) => http.post<any>("/admin/codes/batch", data),
  batches: () => http.get<any[]>("/admin/batches"),
  tests: (params: Record<string, unknown>) =>
    http.get<{ list: any[]; total: number; page: number; pageSize: number }>("/admin/tests", { params }),
  testDetail: (id: number) => http.get<any>(`/admin/tests/${id}`),
  words: (params: Record<string, unknown>) =>
    http.get<{ list: any[]; total: number; page: number; pageSize: number }>("/words", { params }),
  wordDetail: (id: number) => http.get<any>(`/words/${id}`),
  createWord: (data: Record<string, unknown>) => http.post("/words", data),
  updateWord: (id: number, data: Record<string, unknown>) => http.put(`/words/${id}`, data),
  deleteWord: (id: number) => http.delete(`/words/${id}`),
  addMeaning: (wordId: number, meaning: string) => http.post(`/words/${wordId}/meanings`, { meaning }),
  updateMeaning: (id: number, meaning: string) => http.put(`/meanings/${id}`, { meaning }),
  deleteMeaning: (id: number) => http.delete(`/meanings/${id}`),
  questions: (params: Record<string, unknown>) =>
    http.get<{ list: any[]; total: number; page: number; pageSize: number }>("/admin/questions", { params }),
  createQuestion: (data: Record<string, unknown>) => http.post("/admin/questions", data),
  updateQuestion: (id: number, data: Record<string, unknown>) => http.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id: number) => http.delete(`/admin/questions/${id}`)
};
