/**
 * @fileoverview Componente principal de la aplicación (App.jsx)
 * Este es el punto de entrada de la aplicación React que integra todos los componentes principales.
 * Utiliza Vite como herramienta de construcción.
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Navbar from "./components/navbar"; // Componente de navegación
import Cards from "./components/cards"; // Componente que muestra las tarjetas de productos
import Hero from "./components/hero.jsx"; // Sección de bienvenida
import Form from "./pages/Form.jsx"; // Página para agregar nuevos productos
import LoginPage from "./pages/LoginPage";
import AdminPanel from "./pages/AdminPanel.jsx";
import Carousel from "./components/carousel.jsx";
import "./scss/card.css"; // Estilos de tarjetas
import "./scss/navbar.css"; // Estilos de navegación
import "./scss/hero.css"; // Estilos de la sección hero
import "./scss/modal.css"; // Estilos de modales
import RegisterPage from "./pages/RegisterPage.jsx";
import UserManagementPanel from "./pages/UserManagementPanel.jsx"; // Panel de administración de usuarios
import CartPage from "./pages/CartPage.jsx"; // Página del carrito de compras
import UserSettingsPage from "./pages/UserSettingsPage.jsx"; // Página de configuración de usuario
import { CartProvider } from "./context/CartContext"; // Proveedor de contexto para el carrito de compras
import { AuthProvider } from "./context/AuthContext"; // Proveedor de contexto para autenticación
import ProtectedRoute from "./components/ProtectedRoute"; // Componente para proteger rutas

/**
 * Componente principal de la aplicación
 * Estructura la página con la barra de navegación, sección hero y galería de productos
 * @component
 * @returns {JSX.Element} Elemento JSX que contiene la estructura principal de la aplicación
 */
function App() {
  // Aplicar tema oscuro por defecto al cargar la aplicación
  useEffect(() => {
    const applyInitialTheme = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/me", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.theme === "dark") {
            document.body.classList.add("dark-mode");
          }
        }
      } catch (error) {
        console.warn("No se pudo verificar el tema del usuario:", error);
        // Tema oscuro por defecto si no se puede verificar
        document.body.classList.add("dark-mode");
      }
    };

    applyInitialTheme();
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Navbar /> {/* Navbar ahora en todas las páginas */}
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<AppContent />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute requiredPermission="manage_own_profile">
                  <UserSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/carrito"
              element={
                <ProtectedRoute requiredPermission="buy_products">
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/form"
              element={
                <ProtectedRoute requiredPermission="create_products">
                  <Form />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

function AppContent() {
  // Renderiza la estructura principal de la aplicación
  return (
    <div className="App">
      {/* Barra de navegación fija en la parte superior */}
      <Navbar></Navbar>
      {/* Sección de bienvenida con imagen y texto principal */}
      {/* <Hero></Hero> */}
      {/* Carrusel de imágenes debajo del banner */}
      <Carousel></Carousel>
      {/* Galería de productos con búsqueda y modal de detalles */}
      <Cards></Cards>
    </div>
  );
}
