import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Navbar() {
  const {
    user,
    isAuthenticated,
    isInitializing,
    logout,
  } = useAuth();

  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function handleLogout() {
    setError("");

    try {
      await logout();

      navigate("/login", {
        replace: true,
        state: {
          message: "You have been logged out successfully.",
        },
      });
    } catch {
      setError(
        "Logout could not be confirmed by the server. Please try again."
      );
    }
  }

  const userEmail =
    user && typeof user.email === "string"
      ? user.email
      : null;

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            ShopSphere
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#shopsphereNavbar"
            aria-controls="shopsphereNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div
            className="collapse navbar-collapse"
            id="shopsphereNavbar"
          >
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/">
                  Home
                </Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/products">
                  Products
                </Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/cart">
                  Cart
                </Link>
              </li>
            </ul>

            <div className="d-flex align-items-lg-center gap-3">
              {isInitializing ? (
                <span className="navbar-text">
                  Checking session...
                </span>
              ) : isAuthenticated ? (
                <>
                  {userEmail && (
                    <span className="navbar-text">
                      {userEmail}
                    </span>
                  )}

                  <Link
                    className="btn btn-outline-light btn-sm"
                    to="/profile"
                  >
                    Profile
                  </Link>

                  <Link
                    className="btn btn-outline-light btn-sm"
                    to="/orders"
                  >
                    My Orders
                  </Link>

                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    className="btn btn-outline-light btn-sm"
                    to="/login"
                  >
                    Login
                  </Link>

                  <Link
                    className="btn btn-primary btn-sm"
                    to="/register"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {error && (
        <div className="container mt-3">
          <div className="alert alert-warning" role="alert">
            {error}
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;