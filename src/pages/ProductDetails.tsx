import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { productApi, cartApi } from "../api/client";
import { useAuth } from "../auth/AuthContext";

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: string;
  is_active: boolean;
}

function ProductDetails() {
  const { id } = useParams<{ id: string }>();

  // Authentication and navigation
  const { accessToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Product state
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cart state
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");

  // Fetch product details
  useEffect(() => {
    let active = true;

    async function fetchProduct() {
      setLoading(true);
      setError("");
      setProduct(null);

      if (!id) {
        setError("Product ID is missing.");
        setLoading(false);
        return;
      }

      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidPattern.test(id)) {
        setError(
          "Invalid product ID. Please select a product from the catalog."
        );
        setLoading(false);
        return;
      }

      try {
        const data = await productApi.get<Product>(
          `/api/v1/products/${id}`
        );

        if (active) {
          setProduct(data);
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load product details."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchProduct();

    return () => {
      active = false;
    };
  }, [id]);

  // Add product to cart
  async function handleAddToCart() {
    setCartMessage("");
    setCartError("");

    // Redirect unauthenticated users to login
    if (!isAuthenticated || !accessToken) {
      navigate("/login", {
        state: {
          from: location,
          message: "Please log in to add products to your cart.",
        },
      });

      return;
    }

    if (!product || !product.is_active) {
      setCartError("This product is currently unavailable.");
      return;
    }

    setAddingToCart(true);

    try {
      await cartApi.addItem(accessToken, {
        product_id: product.id,
        quantity: 1,
      });

      setCartMessage(`${product.name} was added to your cart.`);
    } catch (err: unknown) {
      setCartError(
        err instanceof Error
          ? err.message
          : "Unable to add this product to your cart."
      );
    } finally {
      setAddingToCart(false);
    }
  }

  // Product loading state
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">
            Loading product...
          </span>
        </div>

        <p className="mt-3">Loading product details...</p>
      </div>
    );
  }

  // Product error state
  if (error || !product) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error || "Product not found."}
        </div>

        <Link to="/products" className="btn btn-outline-primary">
          Back to Products
        </Link>
      </div>
    );
  }

  // Format product price
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(product.price));

  return (
    <div className="container py-5">
      <Link
        to="/products"
        className="btn btn-outline-secondary mb-4"
      >
        &larr; Back to Products
      </Link>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body p-4 p-md-5">
              {/* Product name and availability */}
              <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                <h1 className="h2 mb-0">{product.name}</h1>

                <span
                  className={`badge ${
                    product.is_active
                      ? "text-bg-success"
                      : "text-bg-secondary"
                  }`}
                >
                  {product.is_active
                    ? "Available"
                    : "Unavailable"}
                </span>
              </div>

              {/* Product price */}
              <p className="display-6 fw-semibold text-primary mb-4">
                {formattedPrice}
              </p>

              {/* Product description */}
              <h2 className="h5">Description</h2>

              <p className="text-secondary">
                {product.description?.trim() ||
                  "No description is available for this product."}
              </p>

              <hr />

              {/* Add to Cart feedback */}
              {cartMessage && (
                <div className="alert alert-success" role="status">
                  {cartMessage}{" "}
                  <Link to="/cart" className="alert-link">
                    View Cart
                  </Link>
                </div>
              )}

              {cartError && (
                <div className="alert alert-danger" role="alert">
                  {cartError}
                </div>
              )}

              {/* Add to Cart button */}
              <div className="d-flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleAddToCart}
                  disabled={!product.is_active || addingToCart}
                >
                  {addingToCart ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                      />
                      Adding...
                    </>
                  ) : (
                    "Add to Cart"
                  )}
                </button>

                <Link
                  to="/cart"
                  className="btn btn-outline-primary btn-lg"
                >
                  View Cart
                </Link>
              </div>

              <hr />

              {/* Product identifier */}
              <p className="small text-secondary mb-0">
                Product ID: {product.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;