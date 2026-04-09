/**
 * @fileoverview Página de Formulario de Registro (Form.jsx)
 * Formulario para registro de usuarios con validaciones frontend y backend.
 */

import { useState, useEffect } from "react";

/**
 * Componente Form
 * Renderiza un formulario para agregar nuevos productos a la tienda.
 * El formulario envía los datos a una API backend para almacenarlos.
 *
 * Funcionalidades:
 * - Validación de campos requeridos (imagen)
 * - Generación automática de ID si no se proporciona
 * - Conversión de precio a número
 * - Envío de datos con FormData para incluir archivos
 * - Manejo de errores y mensajes de confirmación
 *
 * Campos del formulario:
 * - nombre: Nombre del producto
 * - descripción: Descripción detallada
 * - precio: Precio del producto
 * - imagen: Archivo de imagen del producto
 * - id: Identificador único (opcional, se genera automáticamente)
 *
 * @component
 * @returns {JSX.Element} Elemento JSX con el formulario
 */
function Form() {
  // Estado para el nombre del producto
  const [nombre, setNombre] = useState("");
  // Estado para el ID único del producto
  const [id, setId] = useState("");
  // Estado para la descripción del producto
  const [descripcion, setDescripcion] = useState("");
  // Estado para el precio del producto
  const [precio, setPrecio] = useState("");
  // Estado para la imagen/archivo seleccionado
  const [imagenes, setImagenes] = useState(null);

  /**
   * Maneja el envío del formulario
   * Valida que haya imagen, prepara los datos y los envía al servidor
   * @param {Event} e - Evento del formulario
   */
  const enviar = async (e) => {
    // Previene el comportamiento por defecto del formulario
    e.preventDefault();

    // Validación: requiere que se seleccione una imagen antes de enviar
    if (!imagenes) {
      alert("Por favor selecciona una imagen antes de enviar.");
      return;
    }

    // Crea un objeto FormData para incluir archivos en la solicitud
    const formData = new FormData();
    // Genera un ID automático si el usuario no lo proporciona
    const sentId = id === "" ? `prod_${Date.now()}` : id;
    formData.append("id", sentId);
    formData.append("nombre", nombre);
    formData.append("descripcion", descripcion);
    // Convierte el precio a número o envía string vacío si no está definido
    formData.append("precio", precio === "" ? "" : Number(precio));
    if (imagenes) {
      // Agrega la imagen al FormData
      formData.append("imagen", imagenes);
    }

    try {
      // Log para debugging - muestra qué datos se envían
      for (const pair of formData.entries()) {
        const key = pair[0];
        const val = pair[1];
        if (val instanceof File) {
          console.log(key, { name: val.name, type: val.type, size: val.size });
        } else {
          console.log(key, val);
        }
      }
      // Envía los datos al servidor via POST
      const response = await fetch("http://localhost/api/subir.php", {
        method: "POST",
        body: formData,
      });

      // Obtiene la respuesta del servidor
      const text = await response.text();
      if (!response.ok) {
        // Lanza error con el código HTTP y mensaje del servidor
        throw new Error(`HTTP ${response.status} - ${text}`);
      }

      // Log de la respuesta del servidor para debugging
      console.log("Server response:", text);
      alert("Producto agregado");
    } catch (error) {
      // Manejo de errores con logs y alertas al usuario
      console.error("Error al agregar el producto:", error);
      alert(`No se pudo agregar el producto: ${error.message}`);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Agregar Producto</h2>
      {/* Formulario para agregar nuevos productos */}
      <form onSubmit={enviar}>
        {/* Campo de nombre */}
        <div className="mb-3">
          <label htmlFor="nombre" className="form-label">
            Nombre
          </label>
          <input
            type="text"
            className="form-control"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        {/* Campo de descripción */}
        <div className="mb-3">
          <label htmlFor="descripcion" className="form-label">
            Descripción
          </label>
          <input
            type="text"
            className="form-control"
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>
        {/* Campo de precio */}
        <div className="mb-3">
          <label htmlFor="precio" className="form-label">
            Precio
          </label>
          <input
            type="number"
            className="form-control"
            id="precio"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </div>
        {/* Campo de imagen - requerido */}
        <div className="mb-3">
          <label htmlFor="imagen" className="form-label">
            Imagen
          </label>
          <input
            type="file"
            className="form-control"
            id="imagen"
            name="imagenes"
            onChange={(e) => setImagenes(e.target.files[0])}
          />
          {/* Botón para enviar el formulario */}
          <button type="submit" className="btn btn-primary mt-3">
            Agregar Producto
          </button>
        </div>
      </form>
    </div>
  );
}

export default Form;
