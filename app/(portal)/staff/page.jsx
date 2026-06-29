"use client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  LuPlus, LuUserX, LuUserCheck, LuX, LuSearch,
  LuPencil,
} from "react-icons/lu";
import {
  listAllStaff, createStaffAccount, deactivateStaff, reactivateStaff,
} from "../../_lib/staff";
import ProtectedRoute from "../../_lib/ProtectedRoutes";
import Link from "next/link";

const ROLES = ["principal", "vice_principal", "form_teacher", "bursar"];

// Module-level cache — survives client-side navigation away from and back to
// this page (the module stays loaded in memory). Resets on a hard refresh,
// which is fine: a fresh load is expected to hit the API once.
let staffCache = null;

function sortNewestFirst(list) {
  return [...list].sort((a, b) => {
    const aDate = new Date(a.created_at ?? 0).getTime();
    const bDate = new Date(b.created_at ?? 0).getTime();
    return bDate - aDate;
  });
}

function StaffContent() {
  const [staff, setStaff] = useState(staffCache ?? []);
  const [isLoading, setIsLoading] = useState(staffCache === null);
  const [roleFilter, setRoleFilter] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deactivateMember, setDeactivateMember] = useState(null);

  useEffect(() => {
    if (staffCache !== null) return; // already cached from a previous visit
    const load = async () => {
      try {
        const data = await listAllStaff();
        console.log(data);
        const list = sortNewestFirst(data?.users ?? data ?? []);
        staffCache = list;
        setStaff(list);
      } catch (err) {
        toast.error(err.message || "Could not load staff list.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleStaffCreated = (newStaff) => {
    const updated = sortNewestFirst([newStaff, ...staff]);
    staffCache = updated;
    setStaff(updated);
    setShowAddModal(false);
  };

  const handleToggleActive = async (member) => {
    if (member.is_active) {
      setDeactivateMember(member);
    } else {
      try {
        await reactivateStaff(member.id);
        const updated = staff.map((s) =>
          s.id === member.id ? { ...s, is_active: true } : s
        );
        staffCache = updated;
        setStaff(updated);
        toast.success("Staff reactivated.");
      } catch (err) {
        toast.error(err.message || "Could not update staff status.");
      }
    }
  };

  const filtered = staff.filter((s) => {
    if (roleFilter && s.role !== roleFilter) return false;
    if (activeOnly && !s.is_active) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${s.first_name ?? ""} ${s.last_name ?? ""}`.toLowerCase();
      if (!name.includes(q) && !(s.email ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-end mb-1.5">
        <div>
          <h1 className="font-serif text-[27px] font-medium">Staff</h1>
          <p className="text-[12.5px] text-[#5C7080] mt-1">
            {staff.length} staff member{staff.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 text-[12.5px] font-medium bg-[#1C2630] text-[#FAF8F4] rounded-[4px] px-3.5 py-2.5"
        >
          <LuPlus size={14} /> Add staff
        </button>
      </div>

      <div className="border-b border-[#DCD5C7] my-5" />

      <div className="flex gap-3 mb-5">
        <div className="flex items-center gap-2 border border-[#DCD5C7] rounded-[4px] px-3 py-2 bg-white flex-1 max-w-[280px]">
          <LuSearch size={14} className="text-[#8A98A3]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className="text-[13px] outline-none bg-transparent w-full"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-[13px] border border-[#DCD5C7] rounded-[4px] px-3 py-2 bg-white outline-none"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.replace("_", " ")}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-[13px] text-[#5C7080] px-2">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Active only
        </label>
      </div>

      {isLoading ? (
        <p className="text-[13.5px] text-[#5C7080]">Loading staff…</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Name", "Email", "Phone", "Role", "Status", ""].map((h) => (
                <th key={h} className="text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="py-3 border-b border-[#DCD5C7] text-[13.5px]">{s.first_name} {s.last_name}</td>
                <td className="py-3 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080]">{s.email}</td>
                <td className="py-3 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080]">{s.phone}</td>
                <td className="py-3 border-b border-[#DCD5C7] text-[13px] capitalize">{s.role?.replace("_", " ")}</td>
                <td className="py-3 border-b border-[#DCD5C7]">
                  <span className={`inline-block text-[11px] font-medium rounded-[3px] px-2 py-0.5 ${
                    s.is_active ? "bg-[#EAEFE6] text-[#5E7A5E]" : "bg-[#F3E7E3] text-[#8B4A3D]"
                  }`}>
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 border-b border-[#DCD5C7] text-right flex items-center gap-4">
                  <button
                    onClick={() => handleToggleActive(s)}
                    className="flex items-center gap-1.5 text-[12px] font-medium border border-[#DCD5C7] bg-white rounded-[3px] px-3 py-1.5 ml-auto"
                  >
                    {s.is_active ? <LuUserX size={12} /> : <LuUserCheck size={12} />}
                    {s.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                  <Link href={`/staff/${s.id}`}>
                    <button className="flex items-center gap-1.5 text-[12px] font-medium border border-[#DCD5C7] bg-white rounded-[3px] px-3 py-1.5 ml-auto">
                      <LuPencil size={12} />
                      View
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[13px] text-[#8A98A3]">
                  No staff match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showAddModal && (
        <AddStaffModal onClose={() => setShowAddModal(false)} onCreated={handleStaffCreated} />
      )}

      {deactivateMember && (
        <DeactivateStaffModal
          member={deactivateMember}
          onClose={() => setDeactivateMember(null)}
          onDeactivated={(memberId) => {
            const updated = staff.map((s) =>
              s.id === memberId ? { ...s, is_active: false } : s
            );
            staffCache = updated;
            setStaff(updated);
            setDeactivateMember(null);
          }}
        />
      )}
    </div>
  );
}

function AddStaffModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", role: "form_teacher" });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const created = await createStaffAccount(form.first_name, form.last_name, form.email, form.phone, form.role);
      toast.success("Staff account created.");
      
      const apiUser = created?.user ?? created?.data ?? created;
      const newStaff = {
        ...form,
        id: crypto.randomUUID(),
        is_active: true,
        created_at: new Date().toISOString(),
        ...(apiUser && typeof apiUser === "object" ? apiUser : {})
      };
      
      onCreated(newStaff);
    } catch (err) {
      toast.error(err.message || "Could not create staff account.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100] px-6">
      <div className="bg-white rounded-[6px] w-full max-w-[420px] px-7 py-7 relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-[#8A98A3]">
          <LuX size={18} />
        </button>

        <h2 className="font-serif text-[18px] font-medium mb-5">Add staff member</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <TextField label="First name" value={form.first_name} onChange={handleChange("first_name")} />
            <TextField label="Last name" value={form.last_name} onChange={handleChange("last_name")} />
          </div>
          <TextField label="Email" type="email" value={form.email} onChange={handleChange("email")} />
          <TextField label="Phone" value={form.phone} onChange={handleChange("phone")} />

          <div className="mb-5">
            <label className="block text-[12px] text-[#5C7080] mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={handleChange("role")}
              className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#9C7A3C]"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.replace("_", " ")}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-[#1C2630] text-[#FAF8F4] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60"
          >
            {isSaving ? "Creating…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

function DeactivateStaffModal({ member, onClose, onDeactivated }) {
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please provide a reason for deactivation.");
      return;
    }
    setIsSaving(true);
    try {
      await deactivateStaff(member.id, reason);
      toast.success("Staff deactivated.");
      onDeactivated(member.id);
    } catch (err) {
      toast.error(err.message || "Could not deactivate staff.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100] px-6">
      <div className="bg-white rounded-[6px] w-full max-w-[420px] px-7 py-7 relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-[#8A98A3]">
          <LuX size={18} />
        </button>

        <h2 className="font-serif text-[18px] font-medium mb-2">Deactivate staff member</h2>
        <p className="text-[13px] text-[#5C7080] mb-5">
          Are you sure you want to deactivate <span className="font-medium text-[#1C2630]">{member.first_name} {member.last_name}</span>? They will no longer be able to log in to the portal.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-[12px] text-[#5C7080] mb-1.5">Reason for deactivation</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Resigned, End of contract, Suspended"
              required
              rows={3}
              className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#9C7A3C] resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-[13.5px] font-medium border border-[#DCD5C7] text-[#5C7080] rounded-[4px] py-2.5 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-[#8B4A3D] text-[#FAF8F4] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60 hover:bg-[#723B30] transition-colors"
            >
              {isSaving ? "Deactivating…" : "Deactivate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TextField({ label, type = "text", value, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-[12px] text-[#5C7080] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required
        className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#9C7A3C]"
      />
    </div>
  );
}

export default function StaffPage() {
  return (
    <ProtectedRoute allowedRoles={["principal", "vice_principal"]}>
      <StaffContent />
    </ProtectedRoute>
  );
}