import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  cartApi,
  productApi,
  orderApi,
  type Cart as CartResponse,
  type CartItem,
  type OrderResponse,
} from "../api/client";

import { useAuth } from "../auth/AuthContext";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  is_active: boolean;
}

interface CheckoutItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  isActive: boolean;
}

function Checkout() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderResponse | null>(null);

  const loadCheckout = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      setError("Please log in to continue to checkout.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cart: CartResponse = await cartApi.getCart(accessToken);

      const checkoutItems = await Promise.all(
        cart.items.map(async (item: CartItem) => {
          const product = await productApi.get<Product>(
            `/api/v1/products/${item.product_id}`
          );

          return {
            productId: item.product_id,
            name: product.name,
            price: Number(product.price),
            quantity: item.quantity,
            isActive: product.is_active,
          };
        })
      );

      setItems(checkoutItems);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load checkout.";

      if (message.includes("Cart not found")) {
        setItems([]);
        setError("");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadCheckout();
  }, [loadCheckout]);

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

  const hasInactiveProducts = items.some((item) => !item.isActive);

  async function handlePlaceOrder() {
    if (!accessToken || placingOrder || items.length === 0) {
      return;
    }

    if (hasInactiveProducts) {
      setError(
        "Your cart contains unavailable products. Remove them before placing your order."
      );
      return;
    }

    setPlacingOrder(true);
    setError("");

    try {
      const createdOrder = await orderApi.createOrder(accessToken);
      setOrder(createdOrder);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to place your order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">
            Loading checkout...
          </span>
        </div>

        <p className="mt-3">Preparing your checkout...</p>
      </div>
    );
  }

  if (order) {
    return (
      <div className="container py-5">
        <div className="alert alert-success" role="alert">
          <h1 className="h4">Order submitted</h1>
          <p className="mb-1">
            Your order request has been processed by the Order Service.
          </p>
          <p className="mb-0">
            Check the status below before assuming the order is confirmed.
          </p>
        </div>

        <div className="card">
          <div className="card-body">
            <h2 className="h5">Order summary</h2>

            <p className="mb-2">
              <strong>Order ID:</strong> {order.id}
            </p>

            <p className="mb-2">
              <strong>Status:</strong>{" "}
              <span className="badge text-bg-primary">
                {order.status}
              </span>
            </p>

            <p className="mb-0">
              <strong>Total:</strong>{" "}
              {formatPrice(Number(order.total_amount))}
            </p>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/orders")}
          >
            View My Orders
          </button>

          <Link to="/products" className="btn btn-outline-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="container py-5">
        <h1 className="h2 mb-4">Checkout</h1>

        <div className="alert alert-danger" role="alert">
          {error}
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void loadCheckout()}
          >
            Try Again
          </button>

          <Link to="/cart" className="btn btn-outline-primary">
            Return to Cart
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-5">
        <h1 className="h2 mb-4">Checkout</h1>

        <div className="alert alert-info" role="alert">
          Your cart is empty. Add products before proceeding to checkout.
        </div>

        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="h2 mb-4">Checkout</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {hasInactiveProducts && (
        <div className="alert alert-warning" role="alert">
          Your cart contains unavailable products. Remove them from your
          cart before placing your order.
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body">
              <h2 className="h5 mb-3">Order items</h2>

              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
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
                        <td>
                          {item.name}

                          {!item.isActive && (
                            <div className="text-danger small">
                              Unavailable
                            </div>
                          )}
                        </td>

                        <td>{formatPrice(item.price)}</td>

                        <td>{item.quantity}</td>

                        <td>
                          {formatPrice(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Link to="/cart" className="btn btn-outline-secondary">
                Return to Cart to Edit
              </Link>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h2 className="h5 mb-3">Order summary</h2>

              <div className="d-flex justify-content-between mb-3">
                <span>Subtotal</span>
                <strong>{formatPrice(total)}</strong>
              </div>

              <p className="text-muted small">
                This is an estimate. The Order Service calculates the
                authoritative order total when the order is submitted.
              </p>

              <button
                type="button"
                className="btn btn-primary w-100"
                disabled={
                  placingOrder ||
                  items.length === 0 ||
                  hasInactiveProducts
                }
                onClick={() => void handlePlaceOrder()}
              >
                {placingOrder ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;