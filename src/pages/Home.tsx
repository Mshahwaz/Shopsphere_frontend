import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { productApi } from "../api/client";
import { useAuth } from "../auth/AuthContext";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  category_id: string;
  is_active: boolean;
}

function formatPrice(price: string): string {
  const amount = Number(price);

  if (!Number.isFinite(amount)) {
    return price;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

function Home() {
  const { isAuthenticated, user, isInitializing } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    productApi
      .get<Product[]>("/api/v1/products")
      .then((data) => {
        if (active) {
          setProducts(data.filter((product) => product.is_active).slice(0, 4));
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load featured products."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const email =
    typeof user?.email === "string" ? user.email : null;

  return (
    <main>
      {/* Hero section */}
      <section className="bg-body-tertiary border-bottom">
        <div className="container py-5">
          <div className="row align-items-center g-4 py-lg-4">
            <div className="col-12 col-lg-8">
              <span className="badge text-bg-primary mb-3">
                Welcome to ShopSphere
              </span>

              <h1 className="display-4 fw-bold mb-3">
                Find products you'll love.
              </h1>

              <p className="lead text-secondary mb-4">
                Discover our product collection, explore the details,
                and shop with a simple checkout experience.
              </p>

              <div className="d-flex flex-wrap gap-2">
                <Link
                  to="/products"
                  className="btn btn-primary btn-lg"
                >
                  Browse Products
                </Link>

                {isAuthenticated ? (
                  <Link
                    to="/cart"
                    className="btn btn-outline-primary btn-lg"
                  >
                    View Cart
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="btn btn-outline-primary btn-lg"
                  >
                    Sign In
                  </Link>
                )}
              </div>

              {!isInitializing && isAuthenticated && (
                <p className="text-secondary mt-3 mb-0">
                  {email
                    ? `Welcome back, ${email}.`
                    : "Welcome back to ShopSphere."}
                </p>
              )}
            </div>

            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <h2 className="h5 fw-bold mb-3">
                    Shop with confidence
                  </h2>

                  <div className="d-flex gap-3 mb-3">
                    <div
                      className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 44, height: 44 }}
                      aria-hidden="true"
                    >
                      <span className="fw-bold">01</span>
                    </div>

                    <div>
                      <h3 className="h6 fw-semibold mb-1">
                        Explore
                      </h3>
                      <p className="text-secondary small mb-0">
                        Browse the available product catalog.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-3 mb-3">
                    <div
                      className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 44, height: 44 }}
                      aria-hidden="true"
                    >
                      <span className="fw-bold">02</span>
                    </div>

                    <div>
                      <h3 className="h6 fw-semibold mb-1">
                        Add to Cart
                      </h3>
                      <p className="text-secondary small mb-0">
                        Select products and manage quantities.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-3">
                    <div
                      className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 44, height: 44 }}
                      aria-hidden="true"
                    >
                      <span className="fw-bold">03</span>
                    </div>

                    <div>
                      <h3 className="h6 fw-semibold mb-1">
                        Checkout
                      </h3>
                      <p className="text-secondary small mb-0">
                        Place orders and track their status.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="container py-5">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end gap-3 mb-4">
          <div>
            <p className="text-primary fw-semibold mb-2">
              OUR COLLECTION
            </p>

            <h2 className="fw-bold mb-2">
              Featured Products
            </h2>

            <p className="text-secondary mb-0">
              Explore a selection from our catalog.
            </p>
          </div>

          <Link
            to="/products"
            className="btn btn-outline-primary align-self-start align-self-sm-auto"
          >
            View All Products
          </Link>
        </div>

        {loading && (
          <div
            className="text-center py-5"
            role="status"
            aria-live="polite"
          >
            <div className="spinner-border text-primary">
              <span className="visually-hidden">
                Loading products...
              </span>
            </div>

            <p className="text-secondary mt-3 mb-0">
              Loading featured products...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-warning" role="alert">
            <h3 className="h6 fw-bold">
              Unable to load featured products
            </h3>

            <p className="mb-3">{error}</p>

            <Link
              to="/products"
              className="btn btn-outline-primary btn-sm"
            >
              Open Product Catalog
            </Link>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="alert alert-info" role="status">
            No active products are currently available.
            <div className="mt-2">
              <Link to="/products">
                Browse the full catalog
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="row g-4">
            {products.map((product) => (
              <div
                className="col-12 col-sm-6 col-lg-3"
                key={product.id}
              >
                <article className="card h-100 shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <span className="badge text-bg-success align-self-start mb-3">
                      Available
                    </span>

                    <h3 className="h5 card-title fw-semibold">
                      {product.name}
                    </h3>

                    <p className="card-text text-secondary flex-grow-1">
                      {product.description ||
                        "View product details for more information."}
                    </p>

                    <div className="border-top pt-3 mt-2">
                      <p className="fs-5 fw-bold mb-3">
                        {formatPrice(product.price)}
                      </p>

                      <Link
                        to={`/products/${product.id}`}
                        className="btn btn-primary w-100"
                      >
                        View Product
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Call to action */}
      <section className="bg-body-tertiary border-top">
        <div className="container py-5 text-center">
          <h2 className="fw-bold mb-3">
            Ready to explore?
          </h2>

          <p className="text-secondary mb-4">
            Browse our catalog and find your next purchase.
          </p>

          <Link
            to="/products"
            className="btn btn-primary btn-lg"
          >
            Explore Products
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;