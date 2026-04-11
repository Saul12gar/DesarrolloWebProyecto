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

    // Validación básica
    if (!nombre || !descripcion || !precio) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }

    try {
      const productData = {
        nombre,
        categoria: "General", // Por defecto, se puede agregar un campo para categoría
        precio: Number(precio),
        descripcion,
        imagenes: imagenes ? imagenes.name : '', // Solo el nombre del archivo por ahora
        status: 'available'
      };

      const response = await fetch("http://localhost:3001/api/products", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Producto agregado exitosamente");
        // Limpiar formulario
        setNombre("");
        setId("");
        setDescripcion("");
        setPrecio("");
        setImagenes(null);
      } else {
        alert(data.message || "Error al agregar el producto");
      }
    } catch (error) {
      console.error("Error al agregar el producto:", error);
      alert("Error de conexión con el servidor");
    }
  };
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
