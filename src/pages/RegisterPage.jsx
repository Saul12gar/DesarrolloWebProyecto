import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../scss/auth.scss"; // Importamos el mismo SCSS

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Cargando...");

    try {
      const response = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setMessage("¡Registro exitoso! Redirigiendo al login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setIsError(true);
        setMessage(data.message || "Error al registrar");
      }
    } catch (error) {
      setIsError(true);
      setMessage("Error de conexión con el servidor");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Crear Cuenta</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Nombre de usuario"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button type="submit" className="primary-btn">
            Registrarse
          </button>
        </form>

        {message && (
          <p className={isError ? "error-msg" : "success-msg"}>{message}</p>
        )}

        {/* Sección para navegar al login */}
        <div className="toggle-auth">
          <p>¿Ya tienes una cuenta?</p>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => navigate("/login")}
          >
            Inicia sesión aquí
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
