import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  orderApi,
  type OrderResponse,
} from "../api/client";

import { useAuth } from "../auth/AuthContext";

function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!id) {
      setError("The order ID is missing.");
      setIsLoading(false);
      return;
    }

    if (!accessToken) {
      setError("Your session is unavailable. Please log in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await orderApi.getOrder(accessToken, id);

      setOrder(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load this order. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, id]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const formatCurrency = (amount: string) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Number(amount));

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div
          className="spinner-border"
          role="status"
          aria-label="Loading order details"
        />
        <p className="mt-3">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <main className="container py-4">
        <div className="alert alert-danger" role="alert">
          {error ?? "Order details are unavailable."}
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => void loadOrder()}
          >
            Retry
          </button>

          <Link to="/orders" className="btn btn-primary">
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Order Details</h1>

        <Link to="/orders" className="btn btn-outline-primary">
          Back to Orders
        </Link>
      </div>

      <section className="card mb-4">
        <div className="card-header">
          <h2 className="h5 mb-0">Order Summary</h2>
        </div>

        <div className="card-body">
          <dl className="row mb-0">
            <dt className="col-sm-3">Order ID</dt>
            <dd className="col-sm-9 font-monospace">{order.id}</dd>

            <dt className="col-sm-3">Status</dt>
            <dd className="col-sm-9">
              <span className="badge text-bg-secondary">
                {order.status}
              </span>
            </dd>

            <dt className="col-sm-3">Total Amount</dt>
            <dd className="col-sm-9 fw-bold">
              {formatCurrency(order.total_amount)}
            </dd>
          </dl>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="h5 mb-0">Order Items</h2>
        </div>

        <div className="card-body">
          {order.items.length === 0 ? (
            <p className="text-muted mb-0">
              No items were returned for this order.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Unit Price</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Subtotal</th>
                  </tr>
                </thead>

                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>

                      <td>{formatCurrency(item.unit_price)}</td>

                      <td>{item.quantity}</td>

                      <td>
                        {formatCurrency(
                          (
                            Number(item.unit_price) * item.quantity
                          ).toString()
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="d-flex justify-content-end border-top pt-3">
            <div>
              <span className="me-3">Order Total</span>
              <strong>
                {formatCurrency(order.total_amount)}
              </strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default OrderDetails;