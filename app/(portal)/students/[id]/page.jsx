"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { LuArrowLeft, LuArrowRightLeft, LuUserX } from "react-icons/lu";
import { useClasses, useGetTerm, useStudent, useStudentFeeStatus } from "@/app/_lib/hooks";
import { deactivateStudent, transferStudentToAnotherClass } from "@/app/_lib/students";
import ProtectedRoute from "@/app/_lib/ProtectedRoutes";

function StudentDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: student, isLoading, isError } = useStudent(id);
  const {
  data: term,
  isLoading: termLoading,
} = useGetTerm();
  const {data: feeStatus, isLoading: feesLoading, isError: feesError} = useStudentFeeStatus(student?.id, term?.id);
  const isLoadingStatus = termLoading || feesLoading;
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
    return <p className="text-[13.5px] text-[#53657E]">Loading student…</p>;
  }

  if (isError || !student) {
    return <p className="text-[13.5px] text-[#8B4A3D]">Student not found.</p>;
  }

  const initials = `${student.first_name?.[0] ?? ""}${student.last_name?.[0] ?? ""}`.toUpperCase();
  const isActive = student.is_active !== false;

  return (
    <div className="student-detail">
      {/* ── Back + actions ── */}
      <div className="student-toolbar flex justify-between items-start mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[12.5px] text-[#53657E] hover:text-[#172B4D]"
        >
          <LuArrowLeft size={14} /> Back to students
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setShowTransfer(true)}
            className="flex items-center gap-1.5 text-[12.5px] font-medium border border-[#DFE6EF] bg-white rounded-[4px] px-3.5 py-2"
          >
            <LuArrowRightLeft size={13} /> Transfer class
          </button>
          {isActive && (
            <button
              onClick={handleDeactivate}
              className="flex items-center gap-1.5 text-[12.5px] font-medium border border-[#DFE6EF] bg-white rounded-[4px] px-3.5 py-2 text-[#8B4A3D]"
            >
              <LuUserX size={13} /> Deactivate
            </button>
          )}
        </div>
      </div>

      {/* ── Identity ── */}
      <div className="profile-hero student-identity flex items-center gap-4 mb-6">
        <div className="student-avatar w-14 h-14 rounded-full bg-[#2563EB] text-[#172B4D] flex items-center justify-center font-serif font-semibold text-xl shrink-0">
          {initials}
        </div>
        <div>
          <p className="profile-eyebrow">Student record</p>
          <h1 className="font-serif text-[27px] font-medium leading-tight">
            {student.first_name} {student.last_name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-[12.5px] text-[#53657E]">{student.reg_number ?? "—"}</span>
            <span className={`inline-block text-[11px] font-medium rounded-[3px] px-2 py-0.5 ${
              isActive ? "bg-[#EAEFE6] text-[#5E7A5E]" : "bg-[#F3E7E3] text-[#8B4A3D]"
            }`}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="profile-caption">{student.class_info?.full_name ?? "Class not assigned"} <span aria-hidden="true">·</span> {term?.name ?? "Current academic term"}</p>
        </div>
      </div>

      <div className="border-b border-[#DFE6EF] mb-7" />

      {/* ── Details grid ── */}
      <div className="student-record-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
  <Section title="Student details">
    <Row label="First name" value={student.first_name} />
    <Row label="Last name" value={student.last_name} />
    <Row label="Gender" value={student.gender} capitalize />
    <Row label="Date of birth" value={student.date_of_birth} mono />
    <Row
      label="Class"
      value={student.class_info?.full_name ?? student.class_id ?? "—"}
    />
    <Row label="Registration no." value={student.reg_number} mono />
  </Section>

  <Section title="Guardian details">
    <Row label="Name" value={student.guardian_name ?? "—"} />
    <Row label="Phone" value={student.guardian_phone ?? "—"} mono />
    <Row label="Email" value={student.guardian_email ?? "—"} mono />
  </Section>

  <Section title="Fees & payments">
    {isLoadingStatus ? (
      <p className="text-[13px] text-[#697A91]">Loading fee status...</p>
    ) : feesError ? (
      <p role="alert" className="text-sm text-[#8B4A3D]">Fee information could not be loaded. Please refresh to try again.</p>
    ) : feeStatus ? (
      <>
        <Row
          label="Status"
          value={feeStatus.status}
        />

        <Row
          label="Total Owed"
          value={`₦${feeStatus.total_owed?.toLocaleString() ?? 0}`}
        />

        <Row
          label="Total Paid"
          value={`₦${feeStatus.total_paid?.toLocaleString() ?? 0}`}
        />

        <div className="mt-5 border-t border-[#E2E8F0] pt-4">
          <p className="text-[11px] uppercase tracking-[0.07em] text-[#697A91] mb-3">
            Invoices
          </p>

          {feeStatus.invoices?.length ? (
            <div className="space-y-3">
              {feeStatus.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border border-[#E7EDF5] rounded-[4px] p-3"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-[13px]">
                      {invoice.fee_type_name}
                    </span>

                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full ${
                        invoice.status === "paid"
                          ? "bg-[#EAEFE6] text-[#5E7A5E]"
                          : "bg-[#F3E7E3] text-[#8B4A3D]"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>

                  <div className="text-[12px] text-[#53657E]">
                    Amount: ₦{invoice.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-[#697A91]">
              No invoices found.
            </p>
          )}
        </div>
      </>
    ) : (
      <p className="text-[13px] text-[#697A91]">
        No fee information available.
      </p>
    )}
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
  const { data: classes = [], isLoading: classesLoading, isError: classesError, refetch } = useClasses();
  const currentClassId = student.class_id ?? student.class_info?.id;
  const currentClass = classes.find((cls) => String(cls.id) === String(currentClassId));
  const currentClassName = student.class_info?.full_name || student.class_name
    || currentClass?.full_name
    || [currentClass?.name ?? student.class_info?.name, currentClass?.arm ?? student.class_info?.arm].filter(Boolean).join(" ")
    || (classesLoading ? "Loading class..." : "Class name unavailable");
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
      <div role="dialog" aria-modal="true" aria-labelledby="transfer-title" className="bg-white rounded-[6px] w-full max-w-[420px] px-7 py-7 relative">
        <button onClick={onClose} aria-label="Close transfer dialog" className="absolute top-5 right-5 text-[#697A91]">✕</button>
        <h2 id="transfer-title" className="font-serif text-[18px] font-medium mb-1">Transfer student</h2>
        <p className="text-[12.5px] text-[#697A91] mb-5">
          Current class: <span className="text-[#172B4D] font-medium">{currentClassName}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="transfer-class" className="block text-[12px] text-[#53657E] mb-1.5">New class</label>
            <select
              id="transfer-class"
              value={newClassId}
              onChange={(e) => setNewClassId(e.target.value)}
              disabled={classesLoading || classesError || isSaving}
              required
              className="w-full text-[13.5px] border border-[#DFE6EF] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#2563EB]"
            >
              <option value="">{classesLoading ? "Loading classes..." : classes.length ? "Select a class" : "No classes available"}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.full_name || [cls.name, cls.arm].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
            {classesError && (
              <p role="alert" className="mt-2 text-[12px] text-[#8B4A3D]">
                Could not load classes. <button type="button" onClick={() => refetch()} className="underline">Try again</button>
              </p>
            )}
          </div>
          <div className="mb-5">
            <label className="block text-[12px] text-[#53657E] mb-1.5">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              className="w-full text-[13.5px] border border-[#DFE6EF] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#2563EB] resize-none"
            />
          </div>
          <button type="submit" disabled={isSaving || classesLoading || classesError || !newClassId} className="w-full bg-[#172B4D] text-[#F4F7FB] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60">
            {isSaving ? "Transferring…" : "Confirm transfer"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="record-panel bg-white border border-[#DFE6EF] rounded-[6px] px-6 py-5">
      <h2 className="record-panel-title text-[11px] uppercase tracking-[0.07em] text-[#697A91] mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, value, mono, capitalize }) {
  return (
    <div className="record-row flex justify-between text-[13px]">
      <span className="text-[#697A91]">{label}</span>
      <span className={`${mono ? "font-mono text-[12.5px]" : ""} ${capitalize ? "capitalize" : ""} text-[#172B4D] text-right`}>
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
