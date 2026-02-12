import { useState } from 'react';

export const useCart = () => {
  const [cart, setCart] = useState([]);

  const addToCart = (product, measurements = {}) => {
    setCart((prev) => [...prev, { ...product, cartId: Date.now(), measurements }]);
  };

  const removeFromCart = (cartId) => {
    setCart((prev) => prev.filter(item => item.cartId !== cartId));
  };

  return { cart, addToCart, removeFromCart, total: cart.length };
};