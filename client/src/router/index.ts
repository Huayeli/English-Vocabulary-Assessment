import { createRouter, createWebHistory } from "vue-router";
import { useCodeStore } from "../stores/code";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/access", component: () => import("../views/access/Access.vue"), meta: { public: true } },
    { path: "/", component: () => import("../views/test/TestCenter.vue"), meta: { auth: true } },
    { path: "/test/adaptive", component: () => import("../views/test/AdaptiveTest.vue"), meta: { auth: true } },
    { path: "/test/verification", component: () => import("../views/test/VerificationTest.vue"), meta: { auth: true } },
    { path: "/test/wrong", component: () => import("../views/test/WrongWordTest.vue"), meta: { auth: true } },
    { path: "/test/result/:sessionId", component: () => import("../views/test/TestResult.vue"), meta: { auth: true } },
    { path: "/report/:sessionId", component: () => import("../views/report/ReportDetail.vue"), meta: { auth: true } },
    { path: "/wrong-words", component: () => import("../views/wrong/WrongWords.vue"), meta: { auth: true } },
    { path: "/admin/key", component: () => import("../views/admin/AdminKey.vue"), meta: { public: true } },
    {
      path: "/admin",
      component: () => import("../layouts/AdminLayout.vue"),
      meta: { auth: true, admin: true },
      children: [
        { path: "", redirect: "dashboard" },
        { path: "dashboard", component: () => import("../views/admin/AdminDashboard.vue") },
        { path: "bank", component: () => import("../views/admin/AdminBank.vue") },
        { path: "tests", component: () => import("../views/admin/AdminTests.vue") },
        { path: "codes", component: () => import("../views/admin/AdminCodes.vue") }
      ]
    }
  ]
});

router.beforeEach((to) => {
  const store = useCodeStore();
  if (to.meta.public) return true;
  if (!store.hasCode) return "/access";
  if (to.meta.admin && !store.isAdminAuthed) return "/admin/key";
  return true;
});

export default router;
