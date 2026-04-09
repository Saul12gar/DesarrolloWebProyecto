// Módulo para la gestión de la interfaz de usuario
import { getData, saveData } from "./data.js";

export const renderUI = () => {
  const data = getData();
  const dataSection = document.querySelector("#data-section");
  dataSection.innerHTML = "";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  thead.innerHTML = `
        <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Acciones</th>
        </tr>
    `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  data.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.status}</td>
        <td>
            <button class="edit-btn" data-id="${item.id}">Editar</button>
            <button class="delete-btn" data-id="${item.id}">Eliminar</button>
        </td>
    `;
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  dataSection.appendChild(table);

  // Delegación de eventos para botones
  dataSection.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const id = e.target.dataset.id;
      if (confirm("¿Estás seguro de eliminar este registro?")) {
        const updatedData = getData().filter((item) => item.id !== id);
        saveData(updatedData);
        renderUI();
      }
    }
  });

  // Handle form submission
  const form = document.querySelector("#data-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.querySelector("#name").value.trim();
    const category = document.querySelector("#category").value.trim();
    const status = document.querySelector("#status").value;

    if (!name || !category) {
      alert("Por favor, complete todos los campos.");
      return;
    }

    const newData = {
      id: Date.now().toString(),
      name,
      category,
      status,
    };

    const data = getData();
    data.push(newData);
    saveData(data);
    renderUI();

    form.reset();
  });

  // Event delegation for edit and delete actions
  document.querySelector("#data-section").addEventListener("click", (e) => {
    if (e.target.classList.contains("edit-btn")) {
      const id = e.target.dataset.id;
      const data = getData();
      const item = data.find((d) => d.id === id);
      if (item) {
        document.querySelector("#name").value = item.name;
        document.querySelector("#category").value = item.category;
        document.querySelector("#status").value = item.status;
        // Optionally, handle editing logic here
      }
    }

    if (e.target.classList.contains("delete-btn")) {
      const id = e.target.dataset.id;
      if (confirm("¿Estás seguro de eliminar este registro?")) {
        const updatedData = getData().filter((item) => item.id !== id);
        saveData(updatedData);
        renderUI();
      }
    }
  });
};
