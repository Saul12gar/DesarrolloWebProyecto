import React, { createContext, useState, useEffect, useContext } from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Cargar el carrito desde la base de datos al iniciar
  const fetchCart = async () => {
    try {
      // Importante: credentials: 'include' envía la cookie de sesión automáticamente
      const response = await fetch("http://localhost:3001/api/cart", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      } else {
        setCart([]); // Si no está logueado, carrito vacío
      }
    } catch (error) {
      console.error("Error al cargar carrito:", error);
    }
  };

  // Ejecutar cuando la app arranca
  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (product) => {
    try {
      await fetch("http://localhost:3001/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ figure_id: product.id }),
        credentials: "include",
      });
      // Volvemos a pedir el carrito a la BD para tenerlo sincronizado
      fetchCart();
    } catch (error) {
      console.error("Error al añadir:", error);
    }
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce(
    (total, item) => total + item.precio * item.quantity,
    0,
  );
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        clearCart,
        cartTotal,
        cartItemCount,
        fetchCart, // Lo exponemos por si quieres recargarlo al hacer login
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
