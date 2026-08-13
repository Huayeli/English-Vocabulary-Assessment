import { http } from "./http";

export interface CodeInfo {
  accessCode: string;
  usedCount: number;
  maxTests: number | null;
  remaining: number | null;
}

export const accessApi = {
  validate: (code: string) => http.post<CodeInfo>("/access/validate", { code })
};
