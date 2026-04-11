import React, { useState, useEffect } from "react";
import axios from "axios";
import SessionsManager from "../components/SessionsManager";
import "../scss/adminPanel.scss";

function AddProductForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    collection: "",
  });
  const [imageFile, setImageFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("nombre", formData.name);
    data.append("descripcion", formData.description);
    data.append("precio", formData.price);
    data.append("categoria", formData.collection);
    data.append("imagen", imageFile);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
      await axios.post(`${API_URL}/api/products`, data, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setFormData({ name: "", description: "", price: "", collection: "" });
      setImageFile(null);
      alert("Producto subido exitosamente");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error subiendo producto:", error);
      alert(error.response?.data?.message || "Error al subir el producto");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-product-form">
      <h2>Añadir Producto</h2>
      <input
        type="text"
        placeholder="Nombre"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Descripción"
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        required
      />
      <input
        type="number"
        placeholder="Precio"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Colección"
        value={formData.collection}
        onChange={(e) =>
          setFormData({ ...formData, collection: e.target.value })
        }
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
        required
      />
      <button type="submit">Añadir Producto</button>
    </form>
  );
}

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

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/users", {
        withCredentials: true,
      });
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar usuarios");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/products", {
        withCredentials: true,
      });
      setProducts(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar productos");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchProducts();
  }, []);

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.nombre || product.name || "",
      price: product.precio || product.price || "",
      description: product.descripcion || product.description || "",
    });
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este producto?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3001/api/products/${productId}`, {
        withCredentials: true,
      });
      setProducts(products.filter((p) => p.id !== productId));
      alert("Producto eliminado exitosamente");
    } catch (err) {
      alert(err.response?.data?.message || "Error al eliminar el producto");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      await axios.put(
        `http://localhost:3001/api/products/${editingProduct.id}`,
        {
          nombre: productForm.name,
          categoria: editingProduct.categoria || "General",
          precio: productForm.price,
          descripcion: productForm.description,
          imagenes: editingProduct.imagenes || "",
          status: editingProduct.status || "available",
        },
        {
          withCredentials: true,
        },
      );
      alert("Producto actualizado correctamente");
      setEditingProduct(null);
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
                <button
                  onClick={() => handleEditClick(product)}
                  className="btn-edit"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="btn-delete"
                >
                  Eliminar
                </button>
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

      <AddProductForm onSuccess={fetchProducts} />

      <SessionsManager />
    </div>
  );
};

export default AdminPanel;
