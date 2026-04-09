// Módulo para la gestión de datos
const DATA_KEY = "app_data";

export const getData = () => {
  const data = localStorage.getItem(DATA_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveData = (data) => {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
};

// Enhance data retrieval to load automatically on page load
export const initData = () => {
  if (!localStorage.getItem(DATA_KEY)) {
    saveData([]);
  } else {
    console.log("Datos cargados desde LocalStorage.");
  }
};
