import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { userApi, type UserProfile } from "../api/client";
import { useAuth } from "../auth/AuthContext";

interface ProfileForm {
  first_name: string;
  last_name: string;
  phone: string;
}

const EMPTY_FORM: ProfileForm = {
  first_name: "",
  last_name: "",
  phone: "",
};

function toForm(profile: UserProfile): ProfileForm {
  return {
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    phone: profile.phone ?? "",
  };
}

function Profile() {
  const navigate = useNavigate();
  const { accessToken, user, logout } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!accessToken) {
        setIsLoading(false);
        setError("Your session is unavailable. Please sign in again.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await userApi.getProfile(accessToken);

        if (cancelled) return;

        setProfile(result);
        setForm(toForm(result));
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your profile."
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError(null);
    setSuccess(null);
  }

  function handleCancel() {
    if (profile) {
      setForm(toForm(profile));
    }

    setIsEditing(false);
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      setError("Your session is unavailable. Please sign in again.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedProfile = await userApi.updateProfile(
        accessToken,
        {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.trim(),
        }
      );

      setProfile(updatedProfile);
      setForm(toForm(updatedProfile));
      setIsEditing(false);
      setSuccess("Your profile has been updated.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your profile."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  const email =
    typeof user?.email === "string" ? user.email : "Unavailable";

  const role =
    typeof user?.role === "string" ? user.role : "Unavailable";

  if (isLoading) {
    return (
      <main className="container py-5">
        <div className="text-center" role="status">
          <div className="spinner-border" aria-hidden="true" />
          <p className="mt-3">Loading your profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-4 py-md-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-9 col-xl-8">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
              <h1 className="h2 mb-1">My Profile</h1>
              <p className="text-secondary mb-0">
                View and manage your account information.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="status">
              {success}
            </div>
          )}

          <section className="card shadow-sm mb-4">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Account Information</h2>

              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  value={email}
                  readOnly
                />
                <div className="form-text">
                  Email is managed by the Auth Service.
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Role</label>
                <input
                  className="form-control"
                  value={role}
                  readOnly
                />
              </div>

              {profile && (
                <div className="mb-3">
                  <label className="form-label">Profile ID</label>
                  <input
                    className="form-control"
                    value={profile.id}
                    readOnly
                  />
                </div>
              )}
            </div>
          </section>

          <section className="card shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2 className="h5 mb-0">Personal Details</h2>

                {!isEditing && profile && (
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => {
                      setForm(toForm(profile));
                      setIsEditing(true);
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {!profile ? (
                <p className="text-secondary mb-0">
                  Your profile could not be loaded. Check that the User
                  Service is running and that your account has a profile.
                </p>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label
                      htmlFor="first_name"
                      className="form-label"
                    >
                      First Name
                    </label>

                    <input
                      id="first_name"
                      name="first_name"
                      className="form-control"
                      value={form.first_name}
                      onChange={handleChange}
                      maxLength={100}
                      readOnly={!isEditing}
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="last_name"
                      className="form-label"
                    >
                      Last Name
                    </label>

                    <input
                      id="last_name"
                      name="last_name"
                      className="form-control"
                      value={form.last_name}
                      onChange={handleChange}
                      maxLength={100}
                      readOnly={!isEditing}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label">
                      Phone Number
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="form-control"
                      value={form.phone}
                      onChange={handleChange}
                      maxLength={20}
                      readOnly={!isEditing}
                    />
                  </div>

                  {isEditing && (
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </section>

          <section className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Quick Links</h2>

              <div className="d-flex flex-wrap gap-2">
                <Link to="/orders" className="btn btn-outline-primary">
                  My Orders
                </Link>

                <Link to="/cart" className="btn btn-outline-primary">
                  View Cart
                </Link>

                <Link
                  to="/products"
                  className="btn btn-outline-secondary"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Profile;