import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  cartApi,
  productApi,
  orderApi,
  type Cart as CartResponse,
  type CartItem,
  type OrderResponse,
  type CheckoutSessionResponse,
  type VerifyOrderPaymentResponse,
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

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal: { ondismiss: () => void };
  theme?: { color: string };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error?: { description?: string; reason?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const RAZORPAY_CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_CHECKOUT_URL}"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      // A previous load may have completed between the initial check and listener registration.
      if (window.Razorpay) resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_URL;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Checkout() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [paymentResult, setPaymentResult] = useState<VerifyOrderPaymentResponse | null>(null);

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
      const message = err instanceof Error ? err.message : "Unable to load checkout.";
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

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasInactiveProducts = items.some((item) => !item.isActive);

  async function verifyPayment(
    orderToVerify: OrderResponse,
    checkout: CheckoutSessionResponse,
    response: RazorpaySuccessResponse
  ) {
    if (!accessToken) {
      setError("Payment was returned by Razorpay, but your session is unavailable. Do not place another order. Check My Orders and contact support if the status remains pending.");
      return;
    }

    setVerifyingPayment(true);
    setError("");
    setNotice("Payment response received. Verifying payment and confirming your order…");

    try {
      const result = await orderApi.verifyPayment(accessToken, orderToVerify.id, {
        payment_id: checkout.payment_id,
        provider_order_id: response.razorpay_order_id,
        provider_payment_id: response.razorpay_payment_id,
        signature: response.razorpay_signature,
      });
      setPaymentResult(result);
      setOrder((current) => current ? { ...current, status: result.order_status } : current);
      setNotice(result.message || "Payment verified.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment verification could not be completed.";
      setError(`${message} Your payment/order status may need reconciliation. Do not create another order or retry payment blindly. Check My Orders before taking further action.`);
      setNotice("");
    } finally {
      setVerifyingPayment(false);
    }
  }

  async function openRazorpay(orderToPay: OrderResponse, checkout: CheckoutSessionResponse) {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      setError("Razorpay Checkout could not be loaded. Your order was created and may still be pending payment. Check My Orders before attempting another checkout.");
      return;
    }

    if (!checkout.provider_key_id || !checkout.provider_order_id) {
      setError("The server did not return the required Razorpay checkout details. Your order may be pending payment. Check My Orders before trying again.");
      return;
    }

    const razorpay = new window.Razorpay({
      key: checkout.provider_key_id,
      amount: Math.round(Number(checkout.amount) * 100),
      currency: checkout.currency || "INR",
      name: "ShopSphere",
      description: `Payment for order ${orderToPay.id}`,
      order_id: checkout.provider_order_id,
      handler: async (response) => {
        await verifyPayment(orderToPay, checkout, response);
      },
      modal: {
        ondismiss: () => {
          setNotice("Checkout was closed before payment verification. The order may remain pending. Check My Orders; do not create another order just to retry.");
        },
      },
      theme: { color: "#0d6efd" },
    });

    razorpay.on("payment.failed", (response) => {
      const description = response.error?.description || "Razorpay reported that the payment failed.";
      setError(`${description} The order may remain pending. Check My Orders for the current status before attempting another order.`);
      setNotice("");
    });
    razorpay.open();
  }

  async function handlePlaceOrder() {
    if (!accessToken || placingOrder || items.length === 0) return;

    if (hasInactiveProducts) {
      setError("Your cart contains unavailable products. Remove them before placing your order.");
      return;
    }

    setPlacingOrder(true);
    setError("");
    setNotice("");

    try {
      const created = await orderApi.createOrder(accessToken);
      setOrder(created.order);
      // Preserve the created order in the UI before launching the external checkout.
      // If checkout loading or payment verification fails, the user is warned not to duplicate the order.
      await openRazorpay(created.order, created.checkout);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to confirm the order request outcome.";
      setError(`${message} The request outcome may be uncertain. Check My Orders before retrying, to avoid creating a duplicate order or inventory reservation.`);
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status"><span className="visually-hidden">Loading checkout...</span></div>
        <p className="mt-3">Preparing your checkout...</p>
      </div>
    );
  }

  if (order) {
    const confirmed = order.status.toUpperCase() === "CONFIRMED" || paymentResult?.order_status.toUpperCase() === "CONFIRMED";
    return (
      <div className="container py-5">
        <div className={`alert ${confirmed ? "alert-success" : error ? "alert-warning" : "alert-info"}`} role="status" aria-live="polite">
          <h1 className="h4">{confirmed ? "Order confirmed" : "Order created — payment status needs attention"}</h1>
          <p className="mb-1">
            {confirmed
              ? "Payment was verified and your order was confirmed."
              : "Creating an order does not confirm payment. Check the status below and in My Orders before attempting another checkout."}
          </p>
          {verifyingPayment && <p className="mb-0">Verifying payment and finalizing inventory…</p>}
        </div>

        {notice && <div className="alert alert-info" role="status">{notice}</div>}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        <div className="card">
          <div className="card-body">
            <h2 className="h5">Order summary</h2>
            <p className="mb-2"><strong>Order ID:</strong> <span className="font-monospace">{order.id}</span></p>
            <p className="mb-2"><strong>Status:</strong> <span className={`badge ${confirmed ? "text-bg-success" : "text-bg-warning"}`}>{order.status}</span></p>
            <p className="mb-0"><strong>Total:</strong> {formatPrice(Number(order.total_amount))}</p>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mt-4">
          <button type="button" className="btn btn-primary" onClick={() => navigate("/orders")}>View My Orders</button>
          <Link to="/products" className="btn btn-outline-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="container py-5">
        <h1 className="h2 mb-4">Checkout</h1>
        <div className="alert alert-danger" role="alert">{error}</div>
        <div className="d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={() => void loadCheckout()}>Try Again</button>
          <Link to="/cart" className="btn btn-outline-primary">Return to Cart</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-5">
        <h1 className="h2 mb-4">Checkout</h1>
        <div className="alert alert-info" role="status">Your cart is empty. Add products before proceeding to checkout.</div>
        <Link to="/products" className="btn btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="h2 mb-4">Checkout</h1>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {hasInactiveProducts && <div className="alert alert-warning" role="alert">Your cart contains unavailable products. Remove them from your cart before placing your order.</div>}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card"><div className="card-body">
            <h2 className="h5 mb-3">Order items</h2>
            <div className="table-responsive"><table className="table align-middle">
              <thead><tr><th scope="col">Product</th><th scope="col">Price</th><th scope="col">Quantity</th><th scope="col">Subtotal</th></tr></thead>
              <tbody>{items.map((item) => <tr key={item.productId}>
                <td>{item.name}{!item.isActive && <div className="text-danger small">Unavailable</div>}</td>
                <td>{formatPrice(item.price)}</td><td>{item.quantity}</td><td>{formatPrice(item.price * item.quantity)}</td>
              </tr>)}</tbody>
            </table></div>
            <Link to="/cart" className="btn btn-outline-secondary">Return to Cart to Edit</Link>
          </div></div>
        </div>
        <div className="col-lg-4">
          <div className="card"><div className="card-body">
            <h2 className="h5 mb-3">Order summary</h2>
            <div className="d-flex justify-content-between mb-3"><span>Subtotal (estimate)</span><strong>{formatPrice(total)}</strong></div>
            <p className="text-muted small">The Order Service calculates the authoritative total. Payment is processed securely through Razorpay; the server verifies the payment before confirming the order.</p>
            <button type="button" className="btn btn-primary w-100" disabled={placingOrder || verifyingPayment || items.length === 0 || hasInactiveProducts} onClick={() => void handlePlaceOrder()}>
              {placingOrder ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Creating checkout…</> : "Proceed to Payment"}
            </button>
          </div></div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
