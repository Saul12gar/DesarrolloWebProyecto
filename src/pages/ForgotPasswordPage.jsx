import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../scss/auth.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Se ha enviado un enlace de recuperación a tu email.");
        setEmail("");
      } else {
        setError(data.message || "Error al enviar el email de recuperación.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Recuperar Contraseña</h2>
        <p className="auth-description">
          Ingresa tu email y te enviaremos un enlace para restablecer tu
          contraseña.
        </p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">← Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
