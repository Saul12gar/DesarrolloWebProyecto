import React from "react";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } =
    useCart();

  if (cart.length === 0) {
    return (
      <div className="container mt-5 text-center">
        <h2>Tu carrito está vacío</h2>
        <p className="text-muted">
          ¡Agrega algunas figuras increíbles a tu colección!
        </p>
        <a href="/" className="btn btn-primary mt-3">
          Volver a la tienda
        </a>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Carrito de Compras</h2>

      <div className="row">
        {/* Lista de productos */}
        <div className="col-lg-8">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="row align-items-center mb-3 border-bottom pb-3"
                >
                  <div className="col-md-2 col-4">
                    <img
                      src={
                        item.imagen ||
                        item.url ||
                        "https://via.placeholder.com/150"
                      }
                      alt={item.nombre}
                      className="img-fluid rounded"
                    />
                  </div>
                  <div className="col-md-4 col-8">
                    <h5>{item.nombre}</h5>
                    <p className="text-muted mb-0">{item.categoria}</p>
                  </div>
                  <div className="col-md-3 col-6 mt-3 mt-md-0 d-flex align-items-center">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      -
                    </button>
                    <span className="mx-3 fw-bold">{item.quantity}</span>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="col-md-2 col-4 mt-3 mt-md-0 text-end fw-bold">
                    ${item.precio * item.quantity}
                  </div>
                  <div className="col-md-1 col-2 mt-3 mt-md-0 text-end">
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <i className="fas fa-trash"></i> Borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen de la compra */}
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h4 className="card-title mb-4">Resumen</h4>
              <div className="d-flex justify-content-between mb-3">
                <span>Subtotal</span>
                <span>${cartTotal}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Envío</span>
                <span className="text-success">Gratis</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4">
                <span className="fw-bold fs-5">Total</span>
                <span className="fw-bold fs-5 text-primary">${cartTotal}</span>
              </div>
              <button className="btn btn-primary w-100 btn-lg mb-2">
                Proceder al pago
              </button>
              <button
                className="btn btn-outline-danger w-100"
                onClick={clearCart}
              >
                Vaciar Carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
