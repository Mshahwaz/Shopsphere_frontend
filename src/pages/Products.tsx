import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { productApi } from "../api/client";

type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  category_id: string;
  is_active: boolean;
};

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    productApi
      .get<Product[]>("/api/v1/products")
      .then((data) => {
        setProducts(data);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load products"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div
          className="spinner-border text-primary"
          role="status"
        >
          <span className="visually-hidden">
            Loading products...
          </span>
        </div>

        <p className="mt-3 text-secondary">
          Loading products...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <h5>Unable to load products</h5>
          <p className="mb-0">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h1 className="fw-bold mb-2">
            ShopSphere Products
          </h1>

          <p className="text-secondary mb-0">
            Discover products for your everyday needs.
          </p>
        </div>

        <span className="badge text-bg-light border mt-3 mt-md-0 fs-6">
          {products.length} products
        </span>
      </div>

      {products.length === 0 ? (
        <div className="alert alert-info">
          No products are currently available.
        </div>
      ) : (
        <div className="row g-4">
          {products.map((product) => (
            <div
              className="col-12 col-sm-6 col-lg-4 col-xl-3"
              key={product.id}
            >
              <article className="card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title fw-semibold">
                    {product.name}
                  </h5>

                  <p className="card-text text-secondary flex-grow-1">
                    {product.description}
                  </p>

                  <div className="border-top pt-3 mt-2">
                    <p className="fw-bold fs-5 mb-3">
                      {product.price}
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
    </main>
  );
}

export default Products;