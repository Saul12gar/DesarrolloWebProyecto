import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../scss/auth.scss";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState(1); // Paso 1: Login, Paso 2: OTP
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { fetchCart } = useCart();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Maneja el paso 1 (Usuario y Contraseña)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("Verificando credenciales...");

    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.requireMfa) {
        // Credenciales correctas, pasamos al código OTP
        setStep(2);
        setMessage("Se ha enviado un código a tu correo.");
      } else {
        setError(data.message || "Credenciales incorrectas");
        setMessage("");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
      setMessage("");
    }
  };

  // Maneja el paso 2 (Verificación de OTP)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:3001/api/verify-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formData.username, otp: otpCode }),
        credentials: "include", // Importante para guardar la cookie de sesión final
      });

      const data = await response.json();

      if (response.ok) {
        await fetchCart(); // Cargamos el carrito de su DB
        navigate("/"); // Redirigimos a inicio
      } else {
        setError(data.message || "Código inválido");
      }
    } catch (err) {
      setError("Error verificando el código");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {step === 1 ? (
          <>
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleLoginSubmit}>
              <input
                type="text"
                name="username"
                placeholder="Nombre de usuario"
                value={formData.username}
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
                Siguiente
              </button>
            </form>
          </>
        ) : (
          <>
            <h2>Verificación de Seguridad</h2>
            <p
              style={{
                color: "#a0a0a0",
                marginBottom: "1rem",
                fontSize: "0.9rem",
              }}
            >
              {message}
            </p>
            <form onSubmit={handleVerifyOtp}>
              <input
                type="text"
                placeholder="Ingresa el código de 6 dígitos"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength="6"
                required
                style={{
                  textAlign: "center",
                  letterSpacing: "5px",
                  fontSize: "1.2rem",
                }}
              />
              <button type="submit" className="primary-btn">
                Verificar e Ingresar
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setStep(1)}
                style={{ marginTop: "10px", width: "100%" }}
              >
                Volver
              </button>
            </form>
          </>
        )}

        {error && <p className="error-msg">{error}</p>}
        {step === 1 && message && !error && (
          <p className="success-msg">{message}</p>
        )}

        {step === 1 && (
          <div className="toggle-auth">
            <p>¿No tienes una cuenta?</p>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate("/register")}
            >
              Regístrate aquí
            </button>
            <p style={{ marginTop: "15px", fontSize: "0.9rem" }}>
              <a
                href="/forgot-password"
                style={{
                  color: "#0d6efd",
                  textDecoration: "none",
                  fontWeight: "500"
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.target.style.textDecoration = "none"}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
