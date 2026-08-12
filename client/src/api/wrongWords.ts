import { http } from "./http";

export interface WrongWordItem {
  id: number;
  headword: string;
  level: string;
  correctMeaning: string;
  errorCount: number;
  lastErrorTime: string;
}

export const wrongWordsApi = {
  list: (page = 1) => http.get<{ list: WrongWordItem[]; total: number; page: number; pageSize: number }>("/wrong-words", { params: { page } }),
  remove: (id: number) => http.delete(`/wrong-words/${id}`),
  review: (id: number) => http.post(`/wrong-words/${id}/review`)
};
