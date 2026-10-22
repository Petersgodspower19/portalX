"use client";
import { useState } from "react";
import { LuMail, LuLock, LuIdCard } from "react-icons/lu";
import { login as loginApi } from "../_lib/auth";
import { useAuth } from "../_lib/AuthContext";
import { toast } from "react-toastify";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const [tab, setTab] = useState("staff"); // "staff" | "student"
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Please fill in both fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await loginApi(identifier, password);

      // Backend may flag a 2FA challenge instead of returning tokens directly —
      // handle that path before assuming `data.access_token` exists.
      if (data.requires_2fa) {
        toast.info("Enter the 2FA code sent to you to continue.");
        // TODO: route to a 2FA verification step once that screen exists
        return;
      }

      localStorage.setItem("token", data.access_token);
      login(
        data.access_token,
        { role: data.role, must_change_password: data.must_change_password },
        data.refresh_token
      );
    } catch (err) {
      toast.error(err.message || "Login failed. Check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <aside className="auth-story">
        <div className="auth-story-brand">PortalX <span>School management</span></div>
        <div className="auth-story-content">
          <span className="auth-eyebrow">Tarepet Montessori</span>
          <h1>A clearer view.<br />A better school day.</h1>
          <p>One workspace for the people, progress, and everyday details that keep your school moving.</p>
          <div className="auth-features"><span>Academics</span><span>Administration</span><span>Student records</span></div>
        </div>
        <div className="auth-story-footer">Built around your school community.</div>
      </aside>
      <div className="auth-form-area">
      <div className="auth-form-container">
        <div className="auth-form-brand">
          <div className="auth-form-logo">PortalX</div>
          <div className="auth-form-school">
            Tarepet Montessori
          </div>
        </div>

        <div className="auth-intro"><h2>Welcome back</h2><p>Sign in to your school workspace.</p></div>
        <div className="auth-card">
          <div className="auth-tabs" role="group" aria-label="Account type">
            <button
              type="button"
              onClick={() => { setTab("staff"); setIdentifier(""); }}
              aria-pressed={tab === "staff"}
            >
              Staff
            </button>
            <button
              type="button"
              onClick={() => { setTab("student"); setIdentifier(""); }}
              aria-pressed={tab === "student"}
            >
              Student
            </button>
          </div>

          <form className="auth-login-form" onSubmit={handleSubmit}>
            {tab === "staff" ? (
              <Field
                label="Email"
                icon={LuMail}
                type="email"
                placeholder="you@tarepet.edu.ng"
                value={identifier}
                onChange={setIdentifier}
              />
            ) : (
              <Field
                label="Registration number"
                icon={LuIdCard}
                type="text"
                placeholder="TM/2024/0118"
                value={identifier}
                onChange={setIdentifier}
              />
            )}
            <Field
              label="Password"
              icon={LuLock}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
            />

            <div className="auth-recovery">
              <a href="#">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-submit"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {tab === "student" && <p className="auth-register-link">
          <Link href="/register">Register as a student</Link>
        </p>}
        <p className="auth-help">
          Having trouble signing in? Contact your school administrator.
        </p>
      </div>
      </div>
    </main>
  );
}

function Field({ label, icon: Icon, type, placeholder, value, onChange }) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <div className="auth-input-wrap">
        <Icon size={15} aria-hidden="true" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={type === "password" ? "current-password" : "username"}
        />
      </div>
    </label>
  );
}
