import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: () => import("../views/auth/Login.vue"), meta: { public: true } },
    { path: "/register", component: () => import("../views/auth/Register.vue"), meta: { public: true } },
    { path: "/forgot", component: () => import("../views/auth/ForgotPassword.vue"), meta: { public: true } },
    { path: "/", component: () => import("../views/test/TestCenter.vue"), meta: { auth: true } },
    { path: "/test/adaptive", component: () => import("../views/test/AdaptiveTest.vue"), meta: { auth: true } },
    { path: "/test/verification", component: () => import("../views/test/VerificationTest.vue"), meta: { auth: true } },
    { path: "/test/wrong", component: () => import("../views/test/WrongWordTest.vue"), meta: { auth: true } },
    { path: "/test/result/:sessionId", component: () => import("../views/test/TestResult.vue"), meta: { auth: true } },
    { path: "/report/:sessionId", component: () => import("../views/report/ReportDetail.vue"), meta: { auth: true } },
    { path: "/wrong-words", component: () => import("../views/wrong/WrongWords.vue"), meta: { auth: true } },
    { path: "/user", component: () => import("../views/user/UserHome.vue"), meta: { auth: true } },
    { path: "/user/settings", component: () => import("../views/user/UserSettings.vue"), meta: { auth: true } },
    {
      path: "/admin",
      component: () => import("../layouts/AdminLayout.vue"),
      meta: { auth: true, admin: true },
      children: [
        { path: "", redirect: "users" },
        { path: "users", component: () => import("../views/admin/AdminUsers.vue") },
        { path: "words", component: () => import("../views/admin/AdminWords.vue") },
        { path: "questions", component: () => import("../views/admin/AdminQuestions.vue") },
        { path: "stats", component: () => import("../views/admin/AdminStats.vue") }
      ]
    }
  ]
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.meta.public) return true;
  if (!auth.isLoggedIn) return "/login";
  await auth.ensureUser();
  if (!auth.isLoggedIn) return "/login";
  if (to.meta.admin && !auth.isAdmin) return "/";
  return true;
});

export default router;
