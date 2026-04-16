import React, { useState, useEffect } from "react";
import axios from "axios";
import "../scss/adminPanel.scss";

// 1. Agregamos la URL dinámica
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function SessionsManager() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      // 2. Usamos API_URL aquí
      const response = await axios.get(`${API_URL}/api/sessions`, {
        withCredentials: true,
      });
      setSessions(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar sesiones");
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async (sessionId) => {
    if (
      !window.confirm(
        "¿Está seguro de que desea cerrar esta sesión? El usuario será desconectado.",
      )
    )
      return;

    try {
      // 3. Usamos API_URL aquí
      await axios.post(
        `${API_URL}/api/sessions/${sessionId}/close`,
        {},
        { withCredentials: true },
      );
      setSessions(sessions.filter((session) => session.id !== sessionId));
      alert("Sesión cerrada exitosamente");
    } catch (err) {
      alert(err.response?.data?.message || "Error al cerrar sesión");
    }
  };

  const handleCloseAllUserSessions = async (userId) => {
    if (
      !window.confirm(
        "¿Está seguro de que desea cerrar TODAS las sesiones de este usuario?",
      )
    )
      return;

    try {
      // 4. Usamos API_URL aquí
      await axios.post(
        `${API_URL}/api/users/${userId}/close-all-sessions`,
        {},
        { withCredentials: true },
      );
      setSessions(sessions.filter((session) => session.user_id !== userId));
      alert("Todas las sesiones del usuario han sido cerradas");
    } catch (err) {
      alert(err.response?.data?.message || "Error al cerrar sesiones");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("es-ES");
  };

  const getDeviceType = (userAgent) => {
    if (!userAgent) return "Desconocido";
    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac")) return "Mac";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iPhone") || userAgent.includes("iPad"))
      return "iOS";
    return "Otro";
  };

  if (loading) return <div className="loading">Cargando sesiones...</div>;

  return (
    <div className="sessions-manager">
      <h2>🔐 Gestor de Sesiones Activas</h2>

      {error && <div className="error-message">{error}</div>}

      {sessions.length === 0 ? (
        <p>No hay sesiones activas en este momento.</p>
      ) : (
        <>
          <p className="sessions-count">
            Total de sesiones activas: <strong>{sessions.length}</strong>
          </p>

          <div className="sessions-table-wrapper">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Dispositivo</th>
                  <th>Iniciada</th>
                  <th>Última Actividad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="user-name">
                      <strong>{session.username}</strong>
                    </td>
                    <td>{session.email}</td>
                    <td>
                      <span
                        className={`role-badge role-${session.role?.toLowerCase()}`}
                      >
                        {session.role}
                      </span>
                    </td>
                    <td>{getDeviceType(session.user_agent)}</td>
                    <td>{formatDate(session.created_at)}</td>
                    <td>{formatDate(session.last_activity)}</td>
                    <td className="actions">
                      <button
                        className="btn-close-session"
                        onClick={() => handleCloseSession(session.id)}
                        title="Cerrar esta sesión"
                      >
                        ✕ Cerrar
                      </button>
                      <button
                        className="btn-close-all"
                        onClick={() =>
                          handleCloseAllUserSessions(session.user_id)
                        }
                        title="Cerrar todas las sesiones de este usuario"
                      >
                        ✕✕ Cerrar Todo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default SessionsManager;
