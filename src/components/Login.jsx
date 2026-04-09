import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaId, setCaptchaId] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchCaptcha = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/captcha");
      if (!response.ok) throw new Error("Error al obtener el CAPTCHA");
      const data = await response.json();
      setCaptchaQuestion(data.question);
      setCaptchaId(data.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          captchaAnswer: captcha,
          captchaId,
        }),
      });

      if (!response.ok) throw new Error("Error al iniciar sesión");
      const data = await response.json();
      alert("Inicio de sesión exitoso: " + data.message);

      // Redirigir al panel de administración si el usuario es administrador
      if (data.isAdmin) {
        navigate("/admin-panel");
      } else {
        alert(
          "Inicio de sesión exitoso, pero no tienes permisos de administrador.",
        );
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Obtener CAPTCHA al cargar el componente
  React.useEffect(() => {
    fetchCaptcha();
  }, []);

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">Correo Electrónico:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="captcha">{captchaQuestion}</label>
          <input
            type="text"
            id="captcha"
            value={captcha}
            onChange={(e) => setCaptcha(e.target.value)}
            required
          />
        </div>
        <button type="submit">Iniciar Sesión</button>
      </form>
    </div>
  );
}
