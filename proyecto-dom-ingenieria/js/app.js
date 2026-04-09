// Punto de entrada de la aplicación
import { initData } from "./data.js";
import { renderUI } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  initData();
  renderUI();
});
