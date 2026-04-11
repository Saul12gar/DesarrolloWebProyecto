import React, { useState, useEffect } from "react";
import axios from "axios";
import "../scss/adminPanel.scss";

function SessionsManager() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSessions();
    // Actualizar sesiones cada 30 segundos
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/sessions", {
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
    ) {
      return;
    }

    try {
      await axios.post(
        `http://localhost:3001/api/sessions/${sessionId}/close`,
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
    ) {
      return;
    }

    try {
      await axios.post(
        `http://localhost:3001/api/users/${userId}/close-all-sessions`,
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

      <style>{`
        .sessions-manager {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          color: #fff;
        }

        .sessions-manager h2 {
          margin-bottom: 1rem;
          color: #fff;
        }

        .sessions-count {
          font-size: 0.95rem;
          color: #a0a0a0;
          margin-bottom: 1rem;
        }

        .sessions-table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sessions-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .sessions-table thead {
          background: rgba(255, 255, 255, 0.08);
          border-bottom: 2px solid rgba(255, 255, 255, 0.15);
        }

        .sessions-table th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #e0e0e0;
        }

        .sessions-table td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .sessions-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .user-name {
          font-weight: 500;
          color: #64b5f6;
        }

        .role-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .role-admin {
          background: rgba(244, 67, 54, 0.2);
          color: #ff6b6b;
        }

        .role-editor {
          background: rgba(33, 150, 243, 0.2);
          color: #64b5f6;
        }

        .role-user {
          background: rgba(76, 175, 80, 0.2);
          color: #81c784;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .btn-close-session,
        .btn-close-all {
          padding: 0.4rem 0.8rem;
          border: none;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-close-session {
          background: rgba(244, 67, 54, 0.3);
          color: #ff6b6b;
        }

        .btn-close-session:hover {
          background: rgba(244, 67, 54, 0.5);
          transform: scale(1.05);
        }

        .btn-close-all {
          background: rgba(233, 30, 99, 0.3);
          color: #ff1744;
        }

        .btn-close-all:hover {
          background: rgba(233, 30, 99, 0.5);
          transform: scale(1.05);
        }

        .error-message {
          padding: 1rem;
          background: rgba(244, 67, 54, 0.2);
          border-left: 4px solid #ff6b6b;
          border-radius: 4px;
          color: #ff6b6b;
          margin-bottom: 1rem;
        }

        .loading {
          padding: 2rem;
          text-align: center;
          color: #a0a0a0;
        }
      `}</style>
    </div>
  );
}

export default SessionsManager;
