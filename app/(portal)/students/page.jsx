"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  LuPlus, LuUpload, LuSearch, LuX, LuArrowUpDown,
  LuUserX, LuArrowRightLeft, LuChevronDown, LuChevronUp,
} from "react-icons/lu";
import { CiUser } from "react-icons/ci";
import {
  listStudents, bulkImport,
  getStudent, transferStudentToAnotherClass, deactivateStudent,
} from "../../_lib/students";
import { useStudents, useStudent, useClasses } from "../../_lib/hooks";
import ProtectedRoute from "../../_lib/ProtectedRoutes";
import Link from "next/link";
import StudentRegistrationForm from "../../_lib/StudentRegistrationForm";

// ─── Main page ─────────────────────────────────────────────────────────────
function StudentsContent() {
  const { data: classes = [], isLoading: loadingClasses } = useClasses();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "", class_id: "", active_only: false,
    sort_by: "created_at", sort_order: "desc",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTimer, setSearchTimer] = useState(null);

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(null); // holds student object

  const activeFilters = { ...filters, search: debouncedSearch };
  const { data: students = [], isLoading } = useStudents(activeFilters);
  // console.log(students);

  const handleSearchChange = (val) => {
    setFilters((f) => ({ ...f, search: val }));
    clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => setDebouncedSearch(val), 400));
  };

  const toggleSort = (field) => {
    setFilters((f) => ({
      ...f,
      sort_by: field,
      sort_order: f.sort_by === field && f.sort_order === "asc" ? "desc" : "asc",
    }));
  };

  const handleEnrolled = (newStudent) => {
    queryClient.invalidateQueries({ queryKey: ["students"] });
    setShowEnrollModal(false);
    toast.success("Student enrolled.");
  };

  const handleBulkDone = () => {
    queryClient.invalidateQueries({ queryKey: ["students"] });
    setShowBulkModal(false);
  };

  const handleDeactivate = async (student) => {
    const reason = window.prompt(`Reason for deactivating ${student.first_name} ${student.last_name}?`);
    if (!reason) return;
    try {
      await deactivateStudent(student.id, reason);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student deactivated.");
    } catch (err) {
      toast.error(err.message || "Could not deactivate student.");
    }
  };

  const SortIcon = ({ field }) => {
    if (filters.sort_by !== field) return <LuArrowUpDown size={11} className="text-[#94A3B8] ml-1" />;
    return filters.sort_order === "asc"
      ? <LuChevronUp size={11} className="text-[#2563EB] ml-1" />
      : <LuChevronDown size={11} className="text-[#2563EB] ml-1" />;
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex justify-between items-end mb-1.5">
        <div>
          <h1 className="font-serif text-[27px] font-medium">Students</h1>
          <p className="text-[12.5px] text-[#53657E] mt-1">
            {isLoading ? "Loading…" : `${students.length} student${students.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 text-[12.5px] font-medium border border-[#DFE6EF] bg-white rounded-[4px] px-3.5 py-2.5"
          >
            <LuUpload size={13} /> Bulk import
          </button>
          <button
            onClick={() => setShowEnrollModal(true)}
            className="flex items-center gap-1.5 text-[12.5px] font-medium bg-[#172B4D] text-[#F4F7FB] rounded-[4px] px-3.5 py-2.5"
          >
            <LuPlus size={14} /> Enroll student
          </button>
        </div>
      </div>

      <div className="border-b border-[#DFE6EF] my-5" />

      {/* ── Filters ── */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 border border-[#DFE6EF] rounded-[4px] px-3 py-2 bg-white flex-1 min-w-[200px] max-w-[280px]">
          <LuSearch size={14} className="text-[#697A91] shrink-0" />
          <input
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search name or reg number"
            className="text-[13px] outline-none bg-transparent w-full"
          />
        </div>

        <input
          value={filters.class_id}
          onChange={(e) => setFilters((f) => ({ ...f, class_id: e.target.value }))}
          placeholder="Filter by class ID"
          className="text-[13px] border border-[#DFE6EF] rounded-[4px] px-3 py-2 bg-white outline-none w-40"
        />

        <label className="flex items-center gap-2 text-[13px] text-[#53657E] px-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.active_only}
            onChange={(e) => setFilters((f) => ({ ...f, active_only: e.target.checked }))}
          />
          Active only
        </label>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <p className="text-[13.5px] text-[#53657E]">Loading students…</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th
                onClick={() => toggleSort("last_name")}
                className="text-left text-[11px] uppercase tracking-[0.06em] text-[#53657E] font-medium pb-2.5 border-b border-[#DFE6EF] cursor-pointer select-none"
              >
                <span className="flex items-center">Name <SortIcon field="last_name" /></span>
              </th>
              <th className="text-left text-[11px] uppercase tracking-[0.06em] text-[#53657E] font-medium pb-2.5 border-b border-[#DFE6EF]">
                Reg number
              </th>
              <th className="text-left text-[11px] uppercase tracking-[0.06em] text-[#53657E] font-medium pb-2.5 border-b border-[#DFE6EF]">
                Class
              </th>
              <th className="text-left text-[11px] uppercase tracking-[0.06em] text-[#53657E] font-medium pb-2.5 border-b border-[#DFE6EF]">
                Gender
              </th>
              <th className="text-left text-[11px] uppercase tracking-[0.06em] text-[#53657E] font-medium pb-2.5 border-b border-[#DFE6EF]">
                Status
              </th>
              <th className="pb-2.5 border-b border-[#DFE6EF]" />
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="group">
                <td className="py-3 border-b border-[#DFE6EF] text-[13.5px]">
                  <button
                    onClick={() => setSelectedStudentId(s.id)}
                    className="hover:text-[#2563EB] text-left"
                  >
                    {s.first_name} {s.last_name}
                  </button>
                </td>
                <td className="py-3 border-b border-[#DFE6EF] text-[12.5px] font-mono text-[#53657E]">
                  {s.reg_number ?? "—"}
                </td>
                <td className="py-3 border-b border-[#DFE6EF] text-[13px]">{s.class_info?.full_name ?? s.class_id ?? "—"}</td>
                <td className="py-3 border-b border-[#DFE6EF] text-[13px] capitalize">{s.gender ?? "—"}</td>
                <td className="py-3 border-b border-[#DFE6EF]">
                  <span className={`inline-block text-[11px] font-medium rounded-[3px] px-2 py-0.5 ${
                    s.is_active !== false ? "bg-[#EAEFE6] text-[#5E7A5E]" : "bg-[#F3E7E3] text-[#8B4A3D]"
                  }`}>
                    {s.is_active !== false ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 border-b border-[#DFE6EF] text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Link href={`/students/${s.id}`}>
                    <button
                      className="flex items-center gap-1 text-[11.5px] font-medium border border-[#DFE6EF] bg-white rounded-[3px] px-2.5 py-1.5"
                    >
                      <CiUser size={11} /> View
                    </button>
                    </Link>
                    <button
                      onClick={() => setShowTransferModal(s)}
                      className="flex items-center gap-1 text-[11.5px] font-medium border border-[#DFE6EF] bg-white rounded-[3px] px-2.5 py-1.5"
                    >
                      <LuArrowRightLeft size={11} /> Transfer
                    </button>
                    {s.is_active !== false && (
                      <button
                        onClick={() => handleDeactivate(s)}
                        className="flex items-center gap-1 text-[11.5px] font-medium border border-[#DFE6EF] bg-white rounded-[3px] px-2.5 py-1.5 text-[#8B4A3D]"
                      >
                        <LuUserX size={11} /> Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[13px] text-[#697A91]">
                  No students match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* ── Modals ── */}
      {showEnrollModal && (
        <EnrollModal onClose={() => setShowEnrollModal(false)} onEnrolled={handleEnrolled} />
      )}
      {showBulkModal && (
        <BulkImportModal onClose={() => setShowBulkModal(false)} onDone={handleBulkDone} />
      )}
      {selectedStudentId && (
        <StudentDetailDrawer
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
      {showTransferModal && (
        <TransferModal
          student={showTransferModal}
          onClose={() => setShowTransferModal(null)}
          onTransferred={() => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            setShowTransferModal(null);
            toast.success("Student transferred.");
          }}
        />
      )}
    </div>
  );
}

// ─── Enroll modal ──────────────────────────────────────────────────────────
function EnrollModal({ onClose, onEnrolled }) {
  return (<Modal title="Enroll student" onClose={onClose} wide>
    <StudentRegistrationForm onRegistered={onEnrolled} submitLabel="Enroll student" />
  </Modal>);
}

// ─── Bulk import modal ─────────────────────────────────────────────────────
function BulkImportModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error("Select a file first."); return; }
    setIsUploading(true);
    try {
      const res = await bulkImport(file);
      toast.success(`Import complete. ${res?.imported ?? ""} students added.`);
      onDone();
    } catch (err) {
      toast.error(err.message || "Import failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal title="Bulk import students" onClose={onClose}>
      <p className="text-[12.5px] text-[#697A91] mb-5">
        Upload a CSV file with columns: first_name, last_name, gender, date_of_birth, class_id, guardian_name, guardian_phone, guardian_email.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="border-2 border-dashed border-[#DFE6EF] rounded-[4px] p-6 text-center mb-5">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
            id="bulk-file"
          />
          <label htmlFor="bulk-file" className="cursor-pointer">
            <LuUpload size={20} className="text-[#697A91] mx-auto mb-2" />
            <p className="text-[13px] text-[#53657E]">
              {file ? file.name : "Click to select a CSV file"}
            </p>
          </label>
        </div>
        <button type="submit" disabled={isUploading || !file} className="w-full bg-[#172B4D] text-[#F4F7FB] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60">
          {isUploading ? "Uploading…" : "Import"}
        </button>
      </form>
    </Modal>
  );
}

// ─── Student detail drawer ─────────────────────────────────────────────────
function StudentDetailDrawer({ studentId, onClose }) {
  const { data: student, isLoading } = useStudent(studentId);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white w-full max-w-[420px] h-full overflow-y-auto shadow-xl px-7 py-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-[18px] font-medium">Student details</h2>
          <button onClick={onClose} className="text-[#697A91]"><LuX size={18} /></button>
        </div>

        {isLoading ? (
          <p className="text-[13.5px] text-[#53657E]">Loading…</p>
        ) : student ? (
          <div>
            <div className="w-12 h-12 rounded-full bg-[#2563EB] text-[#172B4D] flex items-center justify-center font-serif font-semibold text-lg mb-4">
              {student.first_name?.[0]}{student.last_name?.[0]}
            </div>

            <h3 className="font-serif text-[20px] font-medium">{student.first_name} {student.last_name}</h3>
            <p className="font-mono text-[12.5px] text-[#53657E] mt-0.5">{student.reg_number}</p>

            <div className="border-t border-[#DFE6EF] mt-5 pt-5 space-y-3">
              <DetailRow label="Class" value={student.class_name ?? student.class_id ?? "—"} />
              <DetailRow label="Gender" value={student.gender} capitalize />
              <DetailRow label="Date of birth" value={student.date_of_birth} mono />
              <DetailRow label="Status" value={student.is_active !== false ? "Active" : "Inactive"} />
            </div>

            <p className="text-[11px] uppercase tracking-[0.07em] text-[#697A91] mt-6 mb-3">Guardian</p>
            <div className="space-y-3">
              <DetailRow label="Name" value={student.guardian_name ?? "—"} />
              <DetailRow label="Phone" value={student.guardian_phone ?? "—"} mono />
              <DetailRow label="Email" value={student.guardian_email ?? "—"} mono />
            </div>
          </div>
        ) : (
          <p className="text-[13.5px] text-[#697A91]">Student not found.</p>
        )}
      </div>
    </div>
  );
}

// ─── Transfer modal ────────────────────────────────────────────────────────
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
    <Modal title={`Transfer ${student.first_name} ${student.last_name}`} onClose={onClose}>
      <p className="text-[12.5px] text-[#697A91] mb-5">
        Current class: <span className="text-[#172B4D] font-medium">{student.class_name ?? student.class_id ?? "—"}</span>
      </p>
      <form onSubmit={handleSubmit}>
        <TF label="New class ID" value={newClassId} onChange={(e) => setNewClassId(e.target.value)} />
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
        <button type="submit" disabled={isSaving} className="w-full bg-[#172B4D] text-[#F4F7FB] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60">
          {isSaving ? "Transferring…" : "Confirm transfer"}
        </button>
      </form>
    </Modal>
  );
}

// ─── Shared primitives ─────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100] px-6">
      <div className={`bg-white rounded-[6px] w-full ${wide ? "max-w-[560px]" : "max-w-[420px]"} px-7 py-7 relative max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
        <button onClick={onClose} className="absolute top-5 right-5 text-[#697A91]">
          <LuX size={18} />
        </button>
        <h2 className="font-serif text-[18px] font-medium mb-5">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function TF({ label, type = "text", value, onChange, required = true }) {
  return (
    <div className="mb-4">
      <label className="block text-[12px] text-[#53657E] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full text-[13.5px] border border-[#DFE6EF] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#2563EB]"
      />
    </div>
  );
}

function DetailRow({ label, value, mono, capitalize }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-[#697A91]">{label}</span>
      <span className={`${mono ? "font-mono text-[12.5px]" : ""} ${capitalize ? "capitalize" : ""} text-[#172B4D]`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <ProtectedRoute allowedRoles={["principal", "vice_principal"]}>
      <StudentsContent />
    </ProtectedRoute>
  );
}