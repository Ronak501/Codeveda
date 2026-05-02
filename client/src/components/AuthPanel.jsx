import { useState } from "react";

const initialForm = { name: "", email: "", password: "" };

export default function AuthPanel({ mode, loading, onModeChange, onSubmit }) {
  const [form, setForm] = useState(initialForm);

  const isSignup = mode === "signup";

  const submit = async (event) => {
    event.preventDefault();
    await onSubmit(form);
    setForm((prev) => ({ ...prev, password: "" }));
  };

  return (
    <section className="panel auth-panel">
      <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
      <p>
        {isSignup
          ? "Sign up to create and manage products."
          : "Log in to continue."}
      </p>

      <div className="switch-row">
        <button
          type="button"
          className={!isSignup ? "active-switch" : ""}
          onClick={() => onModeChange("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={isSignup ? "active-switch" : ""}
          onClick={() => onModeChange("signup")}
        >
          Signup
        </button>
      </div>

      <form className="form-grid" onSubmit={submit}>
        {isSignup && (
          <>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </>
        )}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={6}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
        </button>
      </form>
    </section>
  );
}
