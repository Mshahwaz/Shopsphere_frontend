import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  // Wait for session restoration to finish.
  if (isInitializing) {
    return (
      <div className="container py-5 text-center">
        <div
          className="spinner-border"
          role="status"
          aria-label="Loading"
        >
          <span className="visually-hidden">
            Loading...
          </span>
        </div>

        <p className="mt-3">
          Checking your session...
        </p>
      </div>
    );
  }

  // Redirect unauthenticated users to login.
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Authenticated users can access the requested route.
  return <Outlet />;
}

export default ProtectedRoute;