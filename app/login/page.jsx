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
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="font-serif text-[24px] font-semibold text-[#1C2630]">PortalX</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-[#9C7A3C] mt-1">
            Tarepet Montessori
          </div>
        </div>

        <div className="bg-white border border-[#DCD5C7] rounded-[6px] overflow-hidden">
          <div className="grid grid-cols-2">
            <button
              type="button"
              onClick={() => { setTab("staff"); setIdentifier(""); }}
              className={`py-3 text-[13.5px] font-medium border-b-2 ${
                tab === "staff"
                  ? "border-[#9C7A3C] text-[#1C2630]"
                  : "border-transparent text-[#8A98A3]"
              }`}
            >
              Staff
            </button>
            <button
              type="button"
              onClick={() => { setTab("student"); setIdentifier(""); }}
              className={`py-3 text-[13.5px] font-medium border-b-2 ${
                tab === "student"
                  ? "border-[#9C7A3C] text-[#1C2630]"
                  : "border-transparent text-[#8A98A3]"
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
              <a href="#" className="text-[12px] text-[#9C7A3C]">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1C2630] text-[#FAF8F4] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[#8A98A3] mt-6">
          Having trouble signing in? Contact your school administrator.
        </p>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, type, placeholder, value, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-[12px] text-[#5C7080] mb-1.5">{label}</label>
      <div className="flex items-center gap-2 border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 focus-within:border-[#9C7A3C]">
        <Icon size={15} className="text-[#8A98A3] shrink-0" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-[13.5px] outline-none bg-transparent placeholder:text-[#B8B2A5]"
        />
      </div>
    </div>
  );
}