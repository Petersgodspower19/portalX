"use client";
import { useState } from "react";
import { LuMail, LuLock, LuIdCard } from "react-icons/lu";
import { login as loginApi } from "../_lib/auth";
import { useAuth } from "../_lib/AuthContext";
import { toast } from "react-toastify";

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
    <div className="auth-page min-h-screen bg-[#F4F7FB] flex items-center justify-center px-6">
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
      <div className="auth-form-container w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="font-serif text-[24px] font-semibold text-[#172B4D]">PortalX</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-[#2563EB] mt-1">
            Tarepet Montessori
          </div>
        </div>

        <div className="auth-intro"><h2>Welcome back</h2><p>Sign in to your school workspace.</p></div>
        <div className="bg-white border border-[#DFE6EF] rounded-[6px] overflow-hidden">
          <div className="grid grid-cols-2">
            <button
              type="button"
              onClick={() => { setTab("staff"); setIdentifier(""); }}
              className={`py-3 text-[13.5px] font-medium border-b-2 ${
                tab === "staff"
                  ? "border-[#2563EB] text-[#172B4D]"
                  : "border-transparent text-[#697A91]"
              }`}
            >
              Staff
            </button>
            <button
              type="button"
              onClick={() => { setTab("student"); setIdentifier(""); }}
              className={`py-3 text-[13.5px] font-medium border-b-2 ${
                tab === "student"
                  ? "border-[#2563EB] text-[#172B4D]"
                  : "border-transparent text-[#697A91]"
              }`}
            >
              Student
            </button>
          </div>

          <form className="px-7 py-7" onSubmit={handleSubmit}>
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

            <div className="flex justify-end mb-5">
              <a href="#" className="text-[12px] text-[#2563EB]">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#172B4D] text-[#F4F7FB] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[#697A91] mt-6">
          Having trouble signing in? Contact your school administrator.
        </p>
      </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, type, placeholder, value, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-[12px] text-[#53657E] mb-1.5">{label}</label>
      <div className="flex items-center gap-2 border border-[#DFE6EF] rounded-[4px] px-3 py-2.5 focus-within:border-[#2563EB]">
        <Icon size={15} className="text-[#697A91] shrink-0" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-[13.5px] outline-none bg-transparent placeholder:text-[#94A3B8]"
        />
      </div>
    </div>
  );
}
