"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { LuArrowLeft, LuArrowRightLeft, LuUserX } from "react-icons/lu";
import { useStudent } from "@/app/_lib/hooks";
import { deactivateStudent, transferStudentToAnotherClass } from "@/app/_lib/students";
import ProtectedRoute from "@/app/_lib/ProtectedRoutes";

function StudentDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: student, isLoading, isError } = useStudent(id);

  const [showTransfer, setShowTransfer] = useState(false);

  const handleDeactivate = async () => {
    const reason = window.prompt(`Reason for deactivating ${student.first_name} ${student.last_name}?`);
    if (!reason) return;
    try {
      await deactivateStudent(id, reason);
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student deactivated.");
    } catch (err) {
      toast.error(err.message || "Could not deactivate student.");
    }
  };

  if (isLoading) {
    return <p className="text-[13.5px] text-[#5C7080]">Loading student…</p>;
  }

  if (isError || !student) {
    return <p className="text-[13.5px] text-[#8B4A3D]">Student not found.</p>;
  }

  const initials = `${student.first_name?.[0] ?? ""}${student.last_name?.[0] ?? ""}`.toUpperCase();
  const isActive = student.is_active !== false;

  return (
    <div>
      {/* ── Back + actions ── */}
      <div className="flex justify-between items-start mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[12.5px] text-[#5C7080] hover:text-[#1C2630]"
        >
          <LuArrowLeft size={14} /> Back to students
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setShowTransfer(true)}
            className="flex items-center gap-1.5 text-[12.5px] font-medium border border-[#DCD5C7] bg-white rounded-[4px] px-3.5 py-2"
          >
            <LuArrowRightLeft size={13} /> Transfer class
          </button>
          {isActive && (
            <button
              onClick={handleDeactivate}
              className="flex items-center gap-1.5 text-[12.5px] font-medium border border-[#DCD5C7] bg-white rounded-[4px] px-3.5 py-2 text-[#8B4A3D]"
            >
              <LuUserX size={13} /> Deactivate
            </button>
          )}
        </div>
      </div>

      {/* ── Identity ── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-[#9C7A3C] text-[#1C2630] flex items-center justify-center font-serif font-semibold text-xl shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="font-serif text-[27px] font-medium leading-tight">
            {student.first_name} {student.last_name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-[12.5px] text-[#5C7080]">{student.reg_number ?? "—"}</span>
            <span className={`inline-block text-[11px] font-medium rounded-[3px] px-2 py-0.5 ${
              isActive ? "bg-[#EAEFE6] text-[#5E7A5E]" : "bg-[#F3E7E3] text-[#8B4A3D]"
            }`}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="border-b border-[#DCD5C7] mb-7" />

      {/* ── Details grid ── */}
      <div className="grid grid-cols-[1fr_1fr] gap-6 max-w-[760px]">
        <Section title="Student details">
          <Row label="First name" value={student.first_name} />
          <Row label="Last name" value={student.last_name} />
          <Row label="Gender" value={student.gender} capitalize />
          <Row label="Date of birth" value={student.date_of_birth} mono />
          <Row label="Class" value={student.class_name ?? student.class_id ?? "—"} />
          <Row label="Registration no." value={student.reg_number} mono />
        </Section>

        <Section title="Guardian details">
          <Row label="Name" value={student.guardian_name ?? "—"} />
          <Row label="Phone" value={student.guardian_phone ?? "—"} mono />
          <Row label="Email" value={student.guardian_email ?? "—"} mono />
        </Section>
      </div>

      {/* ── Transfer modal ── */}
      {showTransfer && (
        <TransferModal
          student={student}
          onClose={() => setShowTransfer(false)}
          onTransferred={() => {
            queryClient.invalidateQueries({ queryKey: ["student", id] });
            queryClient.invalidateQueries({ queryKey: ["students"] });
            setShowTransfer(false);
            toast.success("Student transferred.");
          }}
        />
      )}
    </div>
  );
}

function TransferModal({ student, onClose, onTransferred }) {
  const [newClassId, setNewClassId] = useState("");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await transferStudentToAnotherClass(newClassId, reason, student.id);
      onTransferred();
    } catch (err) {
      toast.error(err.message || "Transfer failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100] px-6">
      <div className="bg-white rounded-[6px] w-full max-w-[420px] px-7 py-7 relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-[#8A98A3]">✕</button>
        <h2 className="font-serif text-[18px] font-medium mb-1">Transfer student</h2>
        <p className="text-[12.5px] text-[#8A98A3] mb-5">
          Current class: <span className="text-[#1C2630] font-medium">{student.class_name ?? student.class_id ?? "—"}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[12px] text-[#5C7080] mb-1.5">New class ID</label>
            <input
              value={newClassId}
              onChange={(e) => setNewClassId(e.target.value)}
              required
              className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#9C7A3C]"
            />
          </div>
          <div className="mb-5">
            <label className="block text-[12px] text-[#5C7080] mb-1.5">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#9C7A3C] resize-none"
            />
          </div>
          <button type="submit" disabled={isSaving} className="w-full bg-[#1C2630] text-[#FAF8F4] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60">
            {isSaving ? "Transferring…" : "Confirm transfer"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white border border-[#DCD5C7] rounded-[6px] px-6 py-5">
      <p className="text-[11px] uppercase tracking-[0.07em] text-[#8A98A3] mb-4">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value, mono, capitalize }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-[#8A98A3]">{label}</span>
      <span className={`${mono ? "font-mono text-[12.5px]" : ""} ${capitalize ? "capitalize" : ""} text-[#1C2630] text-right`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function StudentDetailPage() {
  return (
    <ProtectedRoute allowedRoles={["principal", "vice_principal"]}>
      <StudentDetailContent />
    </ProtectedRoute>
  );
}