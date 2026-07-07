"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { LuLock, LuEye, LuEyeOff } from "react-icons/lu";
import { changePassword } from "@/app/_lib/auth";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      toast.error("New passwords do not match.");
      return;
    }
    if (form.new_password.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      await changePassword(form.current_password, form.new_password, form.confirm_password);
      toast.success("Password changed. Welcome.");
      router.push("/login");
    } catch (err) {
      toast.error(err.message || "Could not change password.");
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

        <div className="bg-white border border-[#DCD5C7] rounded-[6px] px-7 py-7">
          <h2 className="font-serif text-[18px] font-medium mb-1">Set a new password</h2>
          <p className="text-[12.5px] text-[#8A98A3] mb-6">
            You're required to change your password before continuing.
          </p>

          <form onSubmit={handleSubmit}>
            <Field label="Current password" value={form.current_password} onChange={set("current_password")} />
            <Field label="New password" value={form.new_password} onChange={set("new_password")} />
            <Field label="Confirm new password" value={form.confirm_password} onChange={set("confirm_password")} />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1C2630] text-[#FAF8F4] text-[13.5px] font-medium rounded-[4px] py-2.5 mt-1 disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Set new password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="mb-4">
      <label className="block text-[12px] text-[#5C7080] mb-1.5">{label}</label>
      <div className="flex items-center gap-2 border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 focus-within:border-[#9C7A3C]">
        <LuLock size={15} className="text-[#8A98A3] shrink-0" />
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          required
          className="w-full text-[13.5px] outline-none bg-transparent"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="text-[#8A98A3] hover:text-[#5C7080] shrink-0"
        >
          {visible ? <LuEyeOff size={15} /> : <LuEye size={15} />}
        </button>
      </div>
    </div>
  );
}