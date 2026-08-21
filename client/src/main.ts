import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./style.css";
import "@fontsource/baloo-2/400.css";
import "@fontsource/baloo-2/700.css";
import "@fontsource/baloo-2/800.css";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.config.errorHandler = (err) => console.error("[vue error]", err);
window.addEventListener("unhandledrejection", (e) => console.error("[unhandled rejection]", e.reason));
app.mount("#app");
