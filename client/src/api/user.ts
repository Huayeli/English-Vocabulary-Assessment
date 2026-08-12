import { http } from "./http";

export interface UserHome {
  username: string;
  avatar: string | null;
  currentLevel: string | null;
  estimatedVocabulary: number | null;
  testCount: number;
  wrongWordCount: number;
  package: { code: string; name: string };
  recentTests: {
    id: number;
    type: string;
    finalLevel: string | null;
    accuracy: number | null;
    finishedTime: string | null;
  }[];
}

export const userApi = {
  home: () => http.get<UserHome>("/user/home"),
  updateProfile: (data: { avatar?: string }) => http.put("/user/profile", data),
  uploadAvatar: (dataUrl: string) => http.post<{ avatar: string }>("/user/avatar", { dataUrl }),
  myPlan: () => http.get("/user/plan")
};
