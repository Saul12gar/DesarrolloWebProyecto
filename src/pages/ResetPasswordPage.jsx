import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../scss/auth.scss";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token de recuperación no válido.");
      setTokenValid(false);
    } else {
      setTokenValid(true);
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Contraseña actualizada correctamente. Redirigiendo al login...");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(data.message || "Error al actualizar la contraseña.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Enlace Inválido</h2>
          <div className="error-message">
            El enlace de recuperación no es válido o ha expirado.
          </div>
          <div className="auth-links">
            <a href="/forgot-password">Solicitar nuevo enlace</a>
            <a href="/login">Ir al login</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Restablecer Contraseña</h2>
        <p className="auth-description">
          Ingresa tu nueva contraseña.
        </p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            name="password"
            placeholder="Nueva contraseña"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmar nueva contraseña"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength="6"
          />

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar Contraseña"}
          </button>
        </form>

        <div className="auth-links">
          <a href="/login">← Volver al inicio de sesión</a>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;