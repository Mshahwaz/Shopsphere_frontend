import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { cartApi, productApi } from "../api/client";
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

  useEffect(() => {
    let active = true;

    async function loadCart() {
      setLoading(true);
      setError("");

      try {
        if (!accessToken) {
          throw new Error("You must log in to view your cart.");
        }

        const cart = await cartApi.getCart(accessToken);

        const productResults = await Promise.all(
          cart.items.map(async (item) => {
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

        if (active) {
          setItems(productResults);
        }
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        const message =
          err instanceof Error ? err.message : "";

        // Only this specific backend response represents an empty cart.
        if (message.includes("Cart not found")) {
          setItems([]);
          setError("");
        } else {
          setError(
            message || "Unable to load your cart. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCart();

    return () => {
      active = false;
    };
  }, [accessToken]);

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
          onClick={() => window.location.reload()}
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

      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Price</th>
              <th scope="col">Quantity</th>
              <th scope="col">Subtotal</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.productId}>
                <td>{item.name}</td>

                <td>{formatPrice(item.price)}</td>

                <td>{item.quantity}</td>

                <td>
                  {formatPrice(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <th colSpan={3} className="text-end">
                Total
              </th>

              <th>{formatPrice(total)}</th>
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