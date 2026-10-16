import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  cartApi,
  productApi,
  type Cart as CartResponse,
  type CartItem,
} from "../api/client";

import { useAuth } from "../auth/AuthContext";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  is_active: boolean;
}

interface CartLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

function Cart() {
  const { accessToken } = useAuth();

  const [items, setItems] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyProductId, setBusyProductId] = useState<string | null>(
    null
  );

  const loadCart = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      setError("You must log in to view your cart.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cart: CartResponse = await cartApi.getCart(accessToken);

      const productResults = await Promise.all(
        cart.items.map(async (item: CartItem) => {
          const product = await productApi.get<Product>(
            `/api/v1/products/${item.product_id}`
          );

          return {
            productId: item.product_id,
            name: product.name,
            price: Number(product.price),
            quantity: item.quantity,
          };
        })
      );

      setItems(productResults);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";

      if (message.includes("Cart not found")) {
        setItems([]);
        setError("");
      } else {
        setError(message || "Unable to load your cart.");
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  async function handleQuantityChange(
    productId: string,
    currentQuantity: number,
    change: number
  ) {
    const newQuantity = currentQuantity + change;

    if (newQuantity < 1) {
      return;
    }

    if (!accessToken || busyProductId !== null) {
      return;
    }

    setBusyProductId(productId);
    setActionError("");

    try {
      await cartApi.updateItem(accessToken, productId, {
        quantity: newQuantity,
      });

      // Refresh server-backed cart data after a successful update.
      await loadCart();
    } catch (err: unknown) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to update product quantity."
      );
    } finally {
      setBusyProductId(null);
    }
  }

  async function handleRemoveItem(productId: string) {
    if (!accessToken || busyProductId !== null) {
      return;
    }

    setBusyProductId(productId);
    setActionError("");

    try {
      await cartApi.removeItem(accessToken, productId);

      await loadCart();
    } catch (err: unknown) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to remove this product."
      );
    } finally {
      setBusyProductId(null);
    }
  }

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading cart...</span>
        </div>

        <p className="mt-3">Loading your cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <h1 className="h2 mb-4">Shopping Cart</h1>

        <div className="alert alert-danger" role="alert">
          {error}
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void loadCart()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-5">
        <h1 className="h2 mb-4">Shopping Cart</h1>

        {actionError && (
          <div className="alert alert-danger" role="alert">
            {actionError}
          </div>
        )}

        <div className="alert alert-info">
          Your cart is empty.
        </div>

        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="h2 mb-4">Shopping Cart</h1>

      {actionError && (
        <div className="alert alert-danger" role="alert">
          {actionError}
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Price</th>
              <th scope="col">Quantity</th>
              <th scope="col">Subtotal</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const busy = busyProductId === item.productId;

              return (
                <tr key={item.productId}>
                  <td>{item.name}</td>

                  <td>{formatPrice(item.price)}</td>

                  <td>
                    <div
                      className="d-flex align-items-center gap-2"
                      aria-label={`Quantity for ${item.name}`}
                    >
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        aria-label={`Decrease ${item.name} quantity`}
                        disabled={busy || item.quantity <= 1}
                        onClick={() =>
                          void handleQuantityChange(
                            item.productId,
                            item.quantity,
                            -1
                          )
                        }
                      >
                        −
                      </button>

                      <span
                        className="text-center"
                        style={{ minWidth: "2rem" }}
                      >
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        aria-label={`Increase ${item.name} quantity`}
                        disabled={busy}
                        onClick={() =>
                          void handleQuantityChange(
                            item.productId,
                            item.quantity,
                            1
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  </td>

                  <td>
                    {formatPrice(item.price * item.quantity)}
                  </td>

                  <td>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      disabled={busy}
                      onClick={() =>
                        void handleRemoveItem(item.productId)
                      }
                    >
                      {busy ? "Updating..." : "Remove"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr>
              <th colSpan={3} className="text-end">
                Total
              </th>

              <th colSpan={2}>{formatPrice(total)}</th>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="d-flex flex-wrap gap-2 mt-4">
        <Link to="/products" className="btn btn-outline-primary">
          Continue Shopping
        </Link>

        <Link to="/checkout" className="btn btn-primary">
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}

export default Cart;