import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout, hasRole, hasPermission, hasAnyRole } = useAuth();
  const location = useLocation(); // Hook para obtener la ruta actual

  // Determinar si estamos en una página de autenticación
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";
  const isAdminPage = location.pathname === "/admin";
  const isProfilePage = location.pathname === "/perfil";

  // Función para cerrar sesión
  const handleLogout = async () => {
    await logout();
    window.location.href = "/login"; // Redirigimos al login
  };

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary bar fixed-top">
      <div className="container-fluid">
        {/* Logo/Marca de la tienda */}
        <a className="navbar-brand" href="/">
          Astro's Store
        </a>
        {/* Botón toggler para menú móvil */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNavDropdown"
          aria-controls="navbarNavDropdown"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        {/* Menú de navegación colapsable para dispositivos móviles */}
        <div className="collapse navbar-collapse" id="navbarNavDropdown">
          <ul className="navbar-nav">
            {/* Solo mostrar menú completo si NO estamos en páginas de autenticación */}
            {!isAuthPage && (
              <>
                <li className="nav-item">
                  <a
                    className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
                    aria-current="page"
                    href="/"
                  >
                    Inicio
                  </a>
                </li>
                

               
                {/* Enlace al carrito de compras */}
                <li className="nav-item">
                  <a
                    className={`nav-link ${location.pathname === "/carrito" ? "active" : ""}`}
                    href="/carrito"
                  >
                    Siuuuuuuuuuuuuuuuuuuuuuuuuuuuuu Carrito 
                  </a>
                </li>
              </>
            )}

            {/* MENÚ DE CUENTA CONDICIONAL */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {/* Si hay usuario, muestra su nombre; si no, dice "Cuenta" */}
                {user ? `👤 Hola, ${user.username}` : "Cuenta"}
              </a>
              <ul className="dropdown-menu">
                {user ? (
                  // Opciones para cuando ESTÁ logueado
                  <>
                    <li>
                      <a
                        className={`dropdown-item ${isProfilePage ? "active" : ""}`}
                        href="/perfil"
                      >
                        {isProfilePage ? " Configuración" : "Mis Detalles"}
                      </a>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={handleLogout}
                        style={{ cursor: "pointer" }}
                      >
                        Cerrar Sesión
                      </button>
                    </li>
                  </>
                ) : (
                  // Opciones para cuando NO está logueado
                  <>
                    <li>
                      <a
                        className={`dropdown-item ${location.pathname === "/login" ? "active" : ""}`}
                        href="/login"
                      >
                        Inicio de sesión
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item ${location.pathname === "/register" ? "active" : ""}`}
                        href="/register"
                      >
                        Registro
                      </a>
                    </li>
                  </>
                )}
              </ul>
            </li>

            {/* Panel de administración (SOLO VISIBLE PARA ADMINS) */}
            {user && hasRole("admin") && (
              <li className="nav-item">
                <a
                  className={`nav-link ${isAdminPage ? "text-primary fw-bold active" : "text-primary fw-bold"}`}
                  href="/admin"
                >
                  {isAdminPage ? "🔧 Panel Admin" : "Panel de administración"}
                </a>
              </li>
            )}

            {/* Enlace para agregar productos (VISIBLE PARA EDITORES Y ADMINS)
            {user && hasAnyRole(["admin", "editor"]) && (
              <li className="nav-item">
                <a
                  className={`nav-link ${location.pathname === "/form" ? "text-success fw-bold active" : "text-success fw-bold"}`}
                  href="/form"
                >
                  {location.pathname === "/form"
                    ? "📝 Agregar Producto"
                    : "Agregar Producto"}
                </a>
              </li>
            )} */}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
