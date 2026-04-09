import React, { useState, useEffect, useRef } from "react";
import "../scss/register.scss";

const UserManagementPanel = () => {
  const [users, setUsers] = useState([]);

  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
  });

  const usernameInputRef = useRef(null);

  useEffect(() => {
    const storedUsers = localStorage.getItem("users");
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  }, []);

  useEffect(() => {
    if (editingUserId !== null && usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
  }, [editingUserId]);

  const handleEdit = (user) => {
    setEditingUserId(user.id);
    setEditFormData({
      username: user.username,
      email: user.email,
    });
  };

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleSave = (userId) => {
    const updatedUsers = users.map((user) => {
      if (user.id === userId) {
        return {
          ...user,
          username: editFormData.username,
          email: editFormData.email,
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setEditingUserId(null);
  };

  const handleCancel = () => {
    setEditingUserId(null);
  };

  const handleDelete = (indexToDelete) => {
    const isConfirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.",
    );

    if (isConfirmed) {
      const updatedUsers = users.filter((_, index) => index !== indexToDelete);
      setUsers(updatedUsers);
      localStorage.setItem("users", JSON.stringify(updatedUsers));
    }
  };

  return (
    <div className="user-management-panel">
      <h1>Panel de usuarios</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user.id || index}>
              {editingUserId === user.id ? (
                <>
                  <td>{user.id || index}</td>
                  <td>
                    <input
                      type="text"
                      name="username"
                      value={editFormData.username}
                      onChange={handleEditFormChange}
                      ref={usernameInputRef}
                    />
                  </td>
                  <td>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditFormChange}
                    />
                  </td>
                  <td>
                    <button onClick={() => handleSave(user.id)}>Guardar</button>
                    <button onClick={handleCancel}>Cancelar</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{user.id || index}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <button onClick={() => handleEdit(user)}>Editar</button>
                    <button onClick={() => handleDelete(index)}>Borrar</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagementPanel;
