import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { productApi } from "../api/client";

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

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
              <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                <h1 className="h2 mb-0">{product.name}</h1>

                <span
                  className={`badge ${
                    product.is_active
                      ? "text-bg-success"
                      : "text-bg-secondary"
                  }`}
                >
                  {product.is_active ? "Available" : "Unavailable"}
                </span>
              </div>

              <p className="display-6 fw-semibold text-primary mb-4">
                {formattedPrice}
              </p>

              <h2 className="h5">Description</h2>

              <p className="text-secondary">
                {product.description?.trim() ||
                  "No description is available for this product."}
              </p>

              <hr />

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