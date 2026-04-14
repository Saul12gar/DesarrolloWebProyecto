import React, { useEffect, useState } from "react";
import "../scss/user-settings.scss";

const UserSettingsPage = () => {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [preferences, setPreferences] = useState({
    theme: "light",
    language: "es",
    mfa_enabled: false,
  });
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    applyTheme(preferences.theme);
    return () => applyTheme("light");
  }, [preferences.theme]);

  const applyTheme = (theme) => {
    document.body.classList.toggle("dark-mode", theme === "dark");
  };

  const fetchSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/user-settings`, {
        credentials: "include",
      });

      if (!response.ok) {
        setError(
          "No se pudo cargar la configuración. Inicia sesión nuevamente.",
        );
        setLoading(false);
        return;
      }

      const data = await response.json();
      setUser(data.user);
      setPreferences({
        theme: data.user.theme || "light",
        language: data.user.language || "es",
        mfa_enabled: Boolean(data.user.mfa_enabled),
      });
      setSessions(data.sessions || []);
      setCurrentSessionId(data.currentSessionId);
    } catch (err) {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesChange = (field, value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/user-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          theme: preferences.theme,
          language: preferences.language,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "No se pudieron guardar las preferencias.");
        return;
      }

      setMessage("Preferencias guardadas correctamente.");
      setUser(data.user);
    } catch (err) {
      setError("Error guardando preferencias.");
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleToggleMfa = async () => {
    setSavingPreferences(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/user-settings/mfa`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled: !preferences.mfa_enabled }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "No se pudo actualizar MFA.");
        return;
      }

      setPreferences((prev) => ({
        ...prev,
        mfa_enabled: data.user.mfa_enabled,
      }));
      setMessage(
        data.user.mfa_enabled
          ? "MFA activado. El próximo acceso requerirá verificación adicional."
          : "MFA desactivado.",
      );
      setUser(data.user);
    } catch (err) {
      setError("Error actualizando MFA.");
    } finally {
      setSavingPreferences(false);
    }
  };

  const handlePasswordInput = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = async () => {
    setSavingPassword(true);
    setMessage("");
    setError("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError("Completa todos los campos de contraseña.");
      setSavingPassword(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Las nuevas contraseñas no coinciden.");
      setSavingPassword(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/user-settings/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "No se pudo cambiar la contraseña.");
        return;
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage("Contraseña actualizada correctamente.");
    } catch (err) {
      setError("Error cambiando la contraseña.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/user-sessions/${sessionId}/revoke`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "No se pudo cerrar la sesión.");
        return;
      }

      setMessage("Sesión remota cerrada correctamente.");
      fetchSettings();
    } catch (err) {
      setError("Error cerrando la sesión.");
    }
  };

  if (loading) {
    return (
      <div className="user-settings-page">
        <div className="settings-card">
          <h2>Cargando configuración...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-settings-page">
        <div className="settings-card">
          <h2>Debes iniciar sesión</h2>
          <p>Accede a tu cuenta para ver y editar tu configuración.</p>
          <a className="primary-btn" href="/login">
            Ir al inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="user-settings-page">
      <div className="settings-card">
        <h2>Configuración de usuario</h2>
        <p className="subtitle">
          Administra tu cuenta, seguridad y preferencias.
        </p>

        {message && <div className="success-box">{message}</div>}
        {error && <div className="error-box">{error}</div>}

        <section className="settings-section">
          <h3>Datos de la cuenta</h3>
          <div className="user-details-grid">
            <div>
              <strong>Usuario</strong>
              <p>{user.username}</p>
            </div>
            <div>
              <strong>Correo</strong>
              <p>{user.email}</p>
            </div>
            <div>
              <strong>Idioma seleccionado</strong>
              <p>{user.language || "es"}</p>
            </div>
            <div>
              <strong>Tema seleccionado</strong>
              <p>{user.theme || "light"}</p>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h3>Preferencias</h3>
          <label className="option-label">
            Tema claro
            <input
              type="radio"
              name="theme"
              checked={preferences.theme === "light"}
              onChange={() => handlePreferencesChange("theme", "light")}
            />
          </label>
          <label className="option-label">
            Tema oscuro
            <input
              type="radio"
              name="theme"
              checked={preferences.theme === "dark"}
              onChange={() => handlePreferencesChange("theme", "dark")}
            />
          </label>
          <label className="option-label">
            Idioma
            <select
              value={preferences.language}
              onChange={(e) =>
                handlePreferencesChange("language", e.target.value)
              }
            >
              <option value="es">Español</option>
              <option value="en">Inglés</option>
              <option value="pt">Portugués</option>
            </select>
          </label>
          <button
            className="primary-btn"
            onClick={handleSavePreferences}
            disabled={savingPreferences}
          >
            {savingPreferences ? "Guardando..." : "Guardar preferencias"}
          </button>
        </section>

        <section className="settings-section">
          <h3>Autenticación multifactor</h3>
          <p>
            El MFA agrega una capa extra de seguridad. Cuando está activo, el
            inicio de sesión requiere un código adicional.
          </p>
          <button
            className="secondary-btn"
            onClick={handleToggleMfa}
            disabled={savingPreferences}
          >
            {preferences.mfa_enabled ? "Desactivar MFA" : "Activar MFA"}
          </button>
        </section>

        <section className="settings-section">
          <h3>Cambiar contraseña</h3>
          <input
            type="password"
            placeholder="Contraseña actual"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              handlePasswordInput("currentPassword", e.target.value)
            }
          />
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={passwordForm.newPassword}
            onChange={(e) => handlePasswordInput("newPassword", e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              handlePasswordInput("confirmPassword", e.target.value)
            }
          />
          <button
            className="primary-btn"
            onClick={handleChangePassword}
            disabled={savingPassword}
          >
            {savingPassword ? "Actualizando..." : "Cambiar contraseña"}
          </button>
        </section>

        <section className="settings-section">
          <h3>Sesiones activas</h3>
          <p>Revisa tus sesiones iniciadas y cierra las que no reconozcas.</p>
          <div className="sessions-list">
            {sessions.length === 0 ? (
              <p>No hay sesiones activas registradas.</p>
            ) : (
              sessions.map((session) => (
                <div className="session-card" key={session.id}>
                  <div>
                    <strong>Sesión ID:</strong> {session.id}
                  </div>
                  <div>
                    <strong>Dispositivo:</strong>{" "}
                    {session.user_agent || "Desconocido"}
                  </div>
                  <div>
                    <strong>Iniciada:</strong>{" "}
                    {new Date(session.created_at).toLocaleString()}
                  </div>
                  <div>
                    <strong>Última actividad:</strong>{" "}
                    {new Date(session.last_activity).toLocaleString()}
                  </div>
                  <div className="session-actions">
                    {currentSessionId === session.id ? (
                      <span className="current-session">Sesión actual</span>
                    ) : (
                      <button
                        className="secondary-btn"
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        Cerrar sesión remota
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserSettingsPage;
