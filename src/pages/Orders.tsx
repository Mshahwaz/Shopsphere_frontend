import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  orderApi,
  type OrderSummaryResponse,
} from "../api/client";

import { useAuth } from "../auth/AuthContext";

function Orders() {
  const { accessToken } = useAuth();

  const [orders, setOrders] = useState<OrderSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!accessToken) {
      setError("Your session is unavailable. Please log in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await orderApi.listOrders(accessToken);

      setOrders(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your orders. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const formatCurrency = (amount: string) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Number(amount));

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div
          className="spinner-border"
          role="status"
          aria-label="Loading orders"
        />
        <p className="mt-3">Loading your orders...</p>
      </div>
    );
  }

  return (
    <main className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">My Orders</h1>

        <Link to="/products" className="btn btn-outline-primary">
          Continue Shopping
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <p className="mb-2">{error}</p>

          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => void loadOrders()}
          >
            Retry
          </button>
        </div>
      )}

      {!error && orders.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-5">
            <h2 className="h4">No orders yet</h2>

            <p className="text-muted">
              Your completed purchases will appear here.
            </p>

            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        </div>
      )}

      {!error && orders.length > 0 && (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead>
              <tr>
                <th scope="col">Order ID</th>
                <th scope="col">Date</th>
                <th scope="col">Status</th>
                <th scope="col">Total</th>
                <th scope="col">Action</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="font-monospace">
                      {order.id}
                    </span>
                  </td>

                  <td>{formatDate(order.created_at)}</td>

                  <td>
                    <span className="badge text-bg-secondary">
                      {order.status}
                    </span>
                  </td>

                  <td>{formatCurrency(order.total_amount)}</td>

                  <td>
                    <Link
                      to={`/orders/${encodeURIComponent(order.id)}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default Orders;