import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "../scss/auth.scss";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState(1); // Paso 1: Login, Paso 2: OTP
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { login, verifyMfa } = useAuth();
  const { fetchCart } = useCart();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Maneja el paso 1 (Usuario y Contraseña)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("Verificando credenciales...");

    const result = await login(formData);

    if (result.success && result.requireMfa) {
      // Credenciales correctas, pasamos al código OTP
      setStep(2);
      setMessage("Se ha enviado un código a tu correo.");
    } else if (result.success) {
      // Login exitoso sin MFA
      await fetchCart(); // Cargamos el carrito de su DB
      navigate("/"); // Redirigimos a inicio
    } else {
      setError(result.message || "Credenciales incorrectas");
      setMessage("");
    }
  };

  // Maneja el paso 2 (Verificación de OTP)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    const result = await verifyMfa(formData.email, otpCode);

    if (result.success) {
      await fetchCart(); // Cargamos el carrito de su DB
      navigate("/"); // Redirigimos a inicio
    } else {
      setError(result.message || "Código inválido");
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
                  fontWeight: "500",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.textDecoration = "underline")
                }
                onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
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
