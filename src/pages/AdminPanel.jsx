import React, { useState, useEffect } from "react";
import axios from "axios";
import "../scss/adminPanel.scss";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    description: "",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/users", {
          withCredentials: true, // Asegura que se envíen las cookies
        });
        setUsers(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Error al cargar usuarios");
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/products", {
          withCredentials: true, // Asegura que se envíen las cookies
        });
        setProducts(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Error al cargar productos");
      }
    };

    fetchUsers(); // Asegura que se carguen los usuarios
    fetchProducts(); // Asegura que se carguen los productos
  }, []);

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      description: product.description,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:3001/api/products/${editingProduct.id}`,
        productForm,
        {
          withCredentials: true,
        },
      );
      alert("Producto actualizado correctamente");
      setEditingProduct(null);
      // Recargar productos después de la actualización
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || "Error al actualizar el producto");
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="admin-panel">
      <h1>Panel de Administración</h1>

      {/* Tabla de Usuarios */}
      <h2>Usuarios</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <button onClick={() => handleEditClick(user)}>Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tabla de Productos */}
      <h2>Productos</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>{product.nombre}</td>
              <td>{product.precio}</td>
              <td>{product.descripcion}</td>
              <td>
                <button onClick={() => handleEditClick(product)}>Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingProduct && (
        <div className="modal">
          <form onSubmit={handleFormSubmit}>
            <h2>Editar Producto</h2>
            <label>
              Nombre:
              <input
                type="text"
                name="name"
                value={productForm.name}
                onChange={handleFormChange}
              />
            </label>
            <label>
              Precio:
              <input
                type="number"
                name="price"
                value={productForm.price}
                onChange={handleFormChange}
              />
            </label>
            <label>
              Descripción:
              <textarea
                name="description"
                value={productForm.description}
                onChange={handleFormChange}
              />
            </label>
            <button type="submit">Guardar</button>
            <button type="button" onClick={() => setEditingProduct(null)}>
              Cancelar
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
