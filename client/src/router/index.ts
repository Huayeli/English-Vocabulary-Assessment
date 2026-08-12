import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: () => import("../views/auth/Login.vue"), meta: { public: true } },
    { path: "/", component: () => import("../views/test/TestCenter.vue"), meta: { auth: true } },
    { path: "/user", component: () => import("../views/user/UserHome.vue"), meta: { auth: true } }
  ]
});

router.beforeEach((to) => {
  const token = localStorage.getItem("token");
  if (!to.meta.public && !token) return "/login";
  return true;
});

export default router;
