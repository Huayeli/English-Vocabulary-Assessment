import { http } from "./http";

export const wordsApi = {
  list: (params: Record<string, unknown>) =>
    http.get<{ list: any[]; total: number; page: number; pageSize: number }>("/words", { params }),
  detail: (id: number) => http.get<any>(`/words/${id}`),
  create: (data: Record<string, unknown>) => http.post("/words", data),
  update: (id: number, data: Record<string, unknown>) => http.put(`/words/${id}`, data),
  remove: (id: number) => http.delete(`/words/${id}`),
  addMeaning: (wordId: number, meaning: string) => http.post(`/words/${wordId}/meanings`, { meaning }),
  updateMeaning: (id: number, meaning: string) => http.put(`/meanings/${id}`, { meaning }),
  deleteMeaning: (id: number) => http.delete(`/meanings/${id}`)
};
