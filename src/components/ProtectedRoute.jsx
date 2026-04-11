import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({
  children,
  requiredPermission,
  requiredRole,
  requiredRoles = [],
  fallbackPath = "/login",
}) => {
  const { user, loading, hasPermission, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Verificar permiso específico
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Acceso Denegado</h4>
          <p>No tienes permisos para acceder a esta página.</p>
          <hr />
          <p className="mb-0">Permiso requerido: {requiredPermission}</p>
        </div>
      </div>
    );
  }

  // Verificar rol específico
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Acceso Denegado</h4>
          <p>No tienes el rol necesario para acceder a esta página.</p>
          <hr />
          <p className="mb-0">Rol requerido: {requiredRole}</p>
        </div>
      </div>
    );
  }

  // Verificar cualquiera de los roles
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Acceso Denegado</h4>
          <p>
            No tienes ninguno de los roles necesarios para acceder a esta
            página.
          </p>
          <hr />
          <p className="mb-0">Roles requeridos: {requiredRoles.join(", ")}</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
