/**
 * @fileoverview Página de Formulario de Registro (Form.jsx)
 * Formulario para registro de usuarios con validaciones frontend y backend.
 */

import { useState, useEffect } from "react";

/**
 * Componente Form
 * Renderiza un formulario de registro de usuarios.
 *
 * Funcionalidades:
 * - Validación HTML: required, type, pattern
 * - Validación JS: expresiones regulares, confirmación de campos
 * - Mensajes de error personalizados
 * - Integración con backend para validaciones
 * - CAPTCHA básico
 *
 * Campos del formulario:
 * - email: Correo electrónico
 * - password: Contraseña
 * - confirmPassword: Confirmación de contraseña
 * - captchaAnswer: Respuesta al CAPTCHA
 *
 * @component
 * @returns {JSX.Element} Elemento JSX con el formulario
 */
function Form() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [errors, setErrors] = useState({});

  // Cargar CAPTCHA al montar el componente
  useEffect(() => {
    fetchCaptcha();
  }, []);

  const fetchCaptcha = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/captcha");
      const data = await response.json();
      setCaptchaQuestion(data.question);
    } catch (error) {
      console.error("Error fetching CAPTCHA:", error);
    }
  };

  /**
   * Valida el formulario usando expresiones regulares y lógica
   * @returns {boolean} True si válido, false si no
   */
  const validateForm = () => {
    const newErrors = {};

    // Email: formato válido
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      newErrors.password = "Este campo es obligatorio"; // NOSONAR
      newErrors.email = "Este campo es obligatorio"; // NOSONAR
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Formato de correo inválido"; // NOSONAR
    }

    // Password: al menos 6 caracteres, con mayúscula, minúscula, número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;
    if (!password) {
      newErrors.password = "Este campo es obligatorio"; // NOSONAR
    } else if (!passwordRegex.test(password)) {
      newErrors.password =
        "La contraseña debe tener al menos 6 caracteres con mayúscula, minúscula y número"; // NOSONAR
    }

    // Confirm Password
    if (!confirmPassword) {
      newErrors.confirmPassword = "Este campo es obligatorio"; // NOSONAR
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"; // NOSONAR
    }

    // CAPTCHA
    if (!captchaAnswer) {
      newErrors.captcha = "CAPTCHA answer is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Maneja el envío del formulario
   * Valida y envía datos al backend
   * @param {Event} e - Evento del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          captchaAnswer,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Registration successful");
        // Reset form
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setCaptchaAnswer("");
        fetchCaptcha();
      } else {
        setErrors(data.errors || { general: "Registration failed" });
      }
    } catch (error) {
      console.error("Error:", error);
      setErrors({ general: "Network error" });
    }
  };

  return (
    <div className="container mt-5">
      <h2>User Registration</h2>
      <form onSubmit={handleSubmit}>
        {/* Campo Email */}
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email *
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
          />
          {errors.email && <div className="text-danger">{errors.email}</div>}
        </div>

        {/* Campo Password */}
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password *
          </label>
          <input
            type="password"
            className="form-control"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}"
            title="At least 6 characters with uppercase, lowercase, and number"
          />
          {errors.password && (
            <div className="text-danger">{errors.password}</div>
          )}
        </div>

        {/* Campo Confirm Password */}
        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password *
          </label>
          <input
            type="password"
            className="form-control"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {errors.confirmPassword && (
            <div className="text-danger">{errors.confirmPassword}</div>
          )}
        </div>

        {/* CAPTCHA */}
        <div className="mb-3">
          <label className="form-label">{captchaQuestion} *</label>
          <input
            type="text"
            className="form-control"
            value={captchaAnswer}
            onChange={(e) => setCaptchaAnswer(e.target.value)}
            required
          />
          {errors.captcha && (
            <div className="text-danger">{errors.captcha}</div>
          )}
        </div>

        {errors.general && <div className="text-danger">{errors.general}</div>}

        <button type="submit" className="btn btn-primary">
          Register
        </button>
      </form>
    </div>
  );
}

export default Form;
