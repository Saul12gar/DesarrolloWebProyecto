/**
 * @fileoverview Componente de Sección Hero (hero.jsx)
 * Sección de bienvenida principal que contiene una imagen de fondo y mensaje principal.
 */

import React from "react";

/**
 * Componente Hero
 * Renderiza la sección principal de bienvenida de la tienda con imagen de fondo
 * y un botón para navegar a la galería de productos.
 *
 * Características:
 * - Imagen de fondo decorativa
 * - Mensaje de bienvenida
 * - Botón que navega a la sección de figuras
 *
 * @component
 * @returns {JSX.Element} Elemento JSX con la sección hero
 */
function Hero() {
  return (
    <>
      {/* Contenedor principal de la sección hero con imagen de fondo */}
      <div className="hero-image">
        {/* Texto superpuesto sobre la imagen */}
        <div className="hero-text">
          <p>Todas las figuras que buscas en un solo lugar</p>
          {/* Botón que navega a la sección de productos */}
          <a href="#Figuras" className="btn btn-primary">
            Ver Figuras
          </a>
        </div>
      </div>
    </>
  );
}

export default Hero;
