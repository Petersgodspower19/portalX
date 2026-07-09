"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  LuCheck, LuX, LuLock, LuLockOpen, LuUpload,
  LuArrowLeft, LuFileText,
} from "react-icons/lu";
import {
  approveResultsForTerm, rejectResultsForTerm,
  lockTerm, unlockTerm,
  uploadResult, confirmUpload,
} from "../../_lib/results";
import {
  usePendingResults, useClassResults, useGetTerm, useAssignedSubjects, useGetTeachersClass,
  useClasses,
} from "../../_lib/hooks";
import { useAuth } from "../../_lib/AuthContext";
import ProtectedRoute from "../../_lib/ProtectedRoutes";

/* ═══════════════════════════════════════════════════════════════════
   Role router — renders the right view based on logged-in role
═══════════════════════════════════════════════════════════════════ */
function ResultsContent() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === "form_teacher") return <UploadView />;
  return <AdminView isPrincipal={role === "principal"} />;
}

/* ═══════════════════════════════════════════════════════════════════
   Admin view — principal & VP
   Tabs: Pending approval | Class results
   Principal also gets: approve, reject, lock/unlock term
═══════════════════════════════════════════════════════════════════ */
function AdminView({ isPrincipal }) {
  const [tab, setTab] = useState("pending");
  const [drilldown, setDrilldown] = useState(null); // { class_id, class_name }

  return (
    <div>
      <div className="flex justify-between items-end mb-1.5">
        <div>
          <h1 className="font-serif text-[27px] font-medium">Results</h1>
          <p className="text-[12.5px] text-[#5C7080] mt-1">
            {isPrincipal ? "Approval, class results and term controls" : "View submitted and approved results"}
          </p>
        </div>
        {isPrincipal && <TermLockButton />}
      </div>

      <div className="border-b border-[#DCD5C7] mt-5 mb-6 flex gap-1">
        {[{ key: "pending", label: "Pending approval" }, { key: "class", label: "Class results" }].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setDrilldown(null); }}
            className={`text-[13px] font-medium px-3.5 py-2.5 border-b-2 -mb-px ${
              tab === t.key ? "border-[#9C7A3C] text-[#1C2630]" : "border-transparent text-[#8A98A3]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pending" && (
        <PendingTab
          isPrincipal={isPrincipal}
          onViewClass={(item) => { setDrilldown(item); setTab("class"); }}
        />
      )}
      {tab === "class" && (
        <ClassResultsTab drilldown={drilldown} onBack={() => setDrilldown(null)} />
      )}
    </div>
  );
}

/* ── Pending approval tab ─────────────────────────────────────── */
function PendingTab({ isPrincipal, onViewClass }) {
  const queryClient = useQueryClient();
  const { data: pending = [], isLoading } = usePendingResults();
  const { data: term } = useGetTerm();
  const [rejectModal, setRejectModal] = useState(null);

  const handleApprove = async (item) => {
    const confirm = window.confirm(`Approve results for ${item.class_name}?`);
    if (!confirm) return;
    try {
      await approveResultsForTerm(item.class_id, term?.id);
      queryClient.invalidateQueries({ queryKey: ["pending-results"] });
      toast.success(`Results approved for ${item.class_name}.`);
    } catch (err) {
      toast.error(err.message || "Could not approve.");
    }
  };

  const handleReject = async (item, reason) => {
    try {
      await rejectResultsForTerm(item.class_id, term?.id, reason);
      queryClient.invalidateQueries({ queryKey: ["pending-results"] });
      toast.success(`Results rejected for ${item.class_name}.`);
      setRejectModal(null);
    } catch (err) {
      toast.error(err.message || "Could not reject.");
    }
  };

  if (isLoading) return <Skeleton />;

  return (
    <div>
      {pending.length === 0 ? (
        <EmptyState text="No results pending approval." />
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Class", "Subject",  ""].map((h) => (
                <th key={h} className="text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pending.map((r) => (
              <tr key={r.id ?? r.class_id + r.subject_id}>
                <td className="py-3 border-b border-[#DCD5C7] text-[13.5px]">{r.class_name ?? r.class_id}</td>
                <td className="py-3 border-b border-[#DCD5C7] text-[13px]">{r.subject_name ?? r.subject_id}</td>
                <td className="py-3 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080]">{formatDate(r.submitted_at)}</td>
                <td className="py-3 border-b border-[#DCD5C7] text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      onClick={() => onViewClass({ class_id: r.class_id, class_name: r.class_name, term_id: term?.id })}
                      className="flex items-center gap-1 text-[11.5px] font-medium border border-[#DCD5C7] bg-white rounded-[3px] px-2.5 py-1.5"
                    >
                      <LuFileText size={11} /> Review
                    </button>
                    {isPrincipal && (
                      <>
                        <button
                          onClick={() => handleApprove(r)}
                          className="flex items-center gap-1 text-[11.5px] font-medium border border-[#DCD5C7] bg-white rounded-[3px] px-2.5 py-1.5 text-[#5E7A5E]"
                        >
                          <LuCheck size={11} /> Approve
                        </button>
                        <button
                          onClick={() => setRejectModal(r)}
                          className="flex items-center gap-1 text-[11.5px] font-medium border border-[#DCD5C7] bg-white rounded-[3px] px-2.5 py-1.5 text-[#8B4A3D]"
                        >
                          <LuX size={11} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {rejectModal && (
        <NoteModal
          title={`Reject results — ${rejectModal.class_name}`}
          label="Rejection reason"
          confirmLabel="Reject results"
          danger
          onClose={() => setRejectModal(null)}
          onConfirm={(reason) => handleReject(rejectModal, reason)}
        />
      )}
    </div>
  );
}

/* ── Class results drilldown ──────────────────────────────────── */
function ClassResultsTab({ drilldown, onBack }) {
  const { data: term } = useGetTerm();
  const [classId, setClassId] = useState(drilldown?.class_id ?? "");
  const [termId] = useState(drilldown?.term_id ?? term?.id);
  const { data: results = [], isLoading } = useClassResults(classId, termId ?? term?.id);
  const { data: classes = [], isLoading: loadingClasses } = useClasses();
  console.log(results);

  return (
    <div>
      {drilldown && (
        <button onClick={onBack} className="flex items-center gap-1.5 text-[12.5px] text-[#5C7080] hover:text-[#1C2630] mb-5">
          <LuArrowLeft size={13} /> Back to pending
        </button>
      )}

      {!drilldown && (
        <>
        <label className="block text-[12px] text-[#5C7080] mb-1.5">Class ID (optional)</label>
           <div className="mb-6 max-w-[320px]">
  <label className="block text-[12px] text-[#5C7080] mb-1.5">
    Select Class
  </label>

  <select
    value={classId}
    onChange={(e) => setClassId(e.target.value)}
    className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#9C7A3C]"
  >
    <option value="">
      {loadingClasses ? "Loading classes..." : "Select a class"}
    </option>

    {classes.map((cls) => (
      <option key={cls.id} value={cls.id}>
        {cls.full_name}
      </option>
    ))}
  </select>
</div>
        </>
      )}

      {drilldown && (
        <h2 className="font-serif text-[18px] font-medium mb-5">{drilldown.class_name}</h2>
      )}

      {!classId ? (
        <EmptyState text="Enter a class ID to view results." />
      ) : isLoading ? (
        <Skeleton />
      ) : results.length === 0 ? (
        <EmptyState text="No results found for this class." />
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Student", "Reg No",  "CA1", "CA2", "Exam", "Total", "Grade", "Status"].map((h) => (
                <th key={h} className="text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={r.id ?? i}>
                <td className="py-3 border-b border-[#DCD5C7] text-[13.5px]">{r.student_name ?? "—"}</td>
                <td className="py-3 border-b border-[#DCD5C7] text-[13.5px]">{r.reg_number ?? "—"}</td>
                {/* <td className="py-3 border-b border-[#DCD5C7] text-[13px] text-[#5C7080]">{r.subject_name ?? "—"}</td> */}
                <td className="py-3 border-b border-[#DCD5C7] text-[12.5px] font-mono">{r.ca1_score ?? "—"}</td>
                <td className="py-3 border-b border-[#DCD5C7] text-[12.5px] font-mono">{r.ca2_score ?? "—"}</td>
                <td className="py-3 border-b border-[#DCD5C7] text-[12.5px] font-mono">{r.exam_score ?? "—"}</td>
                <td className="py-3 border-b border-[#DCD5C7] text-[12.5px] font-mono font-medium">{r.total_score ?? "—"}</td>
                <td className="py-3 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#9C7A3C]">{r.grade ?? "—"}</td>
                <td className="py-3 border-b border-[#DCD5C7]">
                  <ResultStatusPill status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── Term lock/unlock button ──────────────────────────────────── */
function TermLockButton() {
  const queryClient = useQueryClient();
  const { data: term } = useGetTerm();
  const [loading, setLoading] = useState(false);

  if (!term) return null;

  const isLocked = term.is_locked;

  const handleToggle = async () => {
    const action = isLocked ? "unlock" : "lock";
    const confirm = window.confirm(`${isLocked ? "Unlock" : "Lock"} ${term.name}? ${!isLocked ? "Teachers will no longer be able to upload results." : ""}`);
    if (!confirm) return;
    setLoading(true);
    try {
      isLocked ? await unlockTerm(term.id) : await lockTerm(term.id);
      queryClient.invalidateQueries({ queryKey: ["term"] });
      toast.success(`Term ${action}ed.`);
    } catch (err) {
      toast.error(err.message || `Could not ${action} term.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 text-[12.5px] font-medium border rounded-[4px] px-3.5 py-2.5 disabled:opacity-60 ${
        isLocked
          ? "border-[#DCD5C7] bg-white text-[#5E7A5E]"
          : "border-[#DCD5C7] bg-white text-[#8B4A3D]"
      }`}
    >
      {isLocked ? <LuLockOpen size={13} /> : <LuLock size={13} />}
      {isLocked ? `Unlock ${term.name}` : `Lock ${term.name}`}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Upload view — form teacher only
   Step 1: Pick class subject → upload CSV preview
   Step 2: Confirm upload
═══════════════════════════════════════════════════════════════════ */
function UploadView() {
  const { data: myClass } = useGetTeachersClass();
  const { data: term } = useGetTerm();
  const classId = myClass?.id;
  const termId = term?.id;

  const { data: subjects = [] } = useAssignedSubjects(classId, termId);
  console.log(subjects);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); // response from uploadResult
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedSubject) { toast.error("Select a subject and file."); return; }
    setIsUploading(true);
    try {
      const res = await uploadResult(classId, selectedSubject, termId, file);
      setPreview(res);
      toast.success("File uploaded — review and confirm below.");
    } catch (err) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview?.upload_id) return;
    setIsConfirming(true);
    try {
      await confirmUpload(preview.upload_id);
      toast.success("Results submitted for approval.");
      setPreview(null);
      setFile(null);
      setSelectedSubject("");
    } catch (err) {
      toast.error(err.message || "Could not confirm upload.");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div>
      <div className="mb-1.5">
        <h1 className="font-serif text-[27px] font-medium">Upload results</h1>
        <p className="text-[12.5px] text-[#5C7080] mt-1">
          {myClass ? `${myClass.name} · ${term?.name ?? "—"}` : "Loading your class…"}
        </p>
      </div>

      <div className="border-b border-[#DCD5C7] my-5" />

      {term?.is_locked && (
        <div className="bg-[#F3E7E3] border border-[#DCD5C7] rounded-[4px] px-5 py-4 mb-6 text-[13px] text-[#8B4A3D]">
          This term is locked. Uploading is disabled until the principal unlocks it.
        </div>
      )}

      {!term?.is_locked && (
        <div className="max-w-[520px]">
          <form onSubmit={handleUpload} className="bg-white border border-[#DCD5C7] rounded-[6px] px-7 py-7 mb-6">
            <div className="mb-4">
              <label className="block text-[12px] text-[#5C7080] mb-1.5">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#9C7A3C]"
              >
                <option value="">Select a subject</option>
                {subjects.map((s) => (
                 <option key={s.id ?? s.subject_id} value={s.subject_id ?? s.id}>
                    {s.name ?? s.subject_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-[12px] text-[#5C7080] mb-1.5">Results file (CSV)</label>
              <div className="border-2 border-dashed border-[#DCD5C7] rounded-[4px] p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  id="results-file"
                  className="hidden"
                  onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); }}
                />
                <label htmlFor="results-file" className="cursor-pointer">
                  <LuUpload size={18} className="text-[#8A98A3] mx-auto mb-2" />
                  <p className="text-[13px] text-[#5C7080]">
                    {file ? file.name : "Click to select a CSV file"}
                  </p>
                  <p className="text-[11.5px] text-[#8A98A3] mt-1">
                    Columns: reg_number, ca1, ca2, exam
                  </p>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading || !file || !selectedSubject}
              className="w-full bg-[#1C2630] text-[#FAF8F4] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60"
            >
              {isUploading ? "Uploading…" : "Upload & preview"}
            </button>
          </form>

          {/* Step 2 — preview and confirm */}
          {preview && (
            <div className="bg-white border border-[#DCD5C7] rounded-[6px] px-7 py-7">
              <h2 className="font-serif text-[16px] font-medium mb-1">Review upload</h2>
              <p className="text-[12.5px] text-[#8A98A3] mb-5">
                {preview.valid_rows ?? "—"} valid rows · {preview.error_rows ?? 0} errors
              </p>

              {preview.errors?.length > 0 && (
                <div className="bg-[#F3E7E3] rounded-[4px] px-4 py-3 mb-5">
                  {preview.errors.map((err, i) => (
                    <p key={i} className="text-[12px] text-[#8B4A3D]">{err}</p>
                  ))}
                </div>
              )}

              {preview.preview?.length > 0 && (
                <table className="w-full border-collapse mb-5">
                  <thead>
                    <tr>
                      {["Reg no.", "CA1", "CA2", "Exam", "Total"].map((h) => (
                        <th key={h} className="text-left text-[11px] uppercase tracking-[0.05em] text-[#5C7080] font-medium pb-2 border-b border-[#DCD5C7]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview.map((row, i) => (
                      <tr key={i}>
                        <td className="py-2 border-b border-[#DCD5C7] font-mono text-[12px]">{row.reg_number}</td>
                        <td className="py-2 border-b border-[#DCD5C7] font-mono text-[12px]">{row.ca1}</td>
                        <td className="py-2 border-b border-[#DCD5C7] font-mono text-[12px]">{row.ca2}</td>
                        <td className="py-2 border-b border-[#DCD5C7] font-mono text-[12px]">{row.exam}</td>
                        <td className="py-2 border-b border-[#DCD5C7] font-mono text-[12px] font-medium">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="flex-1 bg-[#1C2630] text-[#FAF8F4] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60"
                >
                  {isConfirming ? "Submitting…" : "Confirm & submit for approval"}
                </button>
                <button
                  onClick={() => { setPreview(null); setFile(null); }}
                  className="border border-[#DCD5C7] bg-white text-[13.5px] font-medium rounded-[4px] px-4 py-2.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Shared ─────────────────────────────────────────────────────────────── */

function ResultStatusPill({ status }) {
  const map = {
    submitted: "bg-[#FAEEDA] text-[#854F0B]",
    approved: "bg-[#EAEFE6] text-[#5E7A5E]",
    rejected: "bg-[#F3E7E3] text-[#8B4A3D]",
    draft: "bg-[#F3F3F3] text-[#8A98A3]",
  };
  return (
    <span className={`inline-block text-[11px] font-medium rounded-[3px] px-2 py-0.5 capitalize ${map[status] ?? "bg-[#F3F3F3] text-[#8A98A3]"}`}>
      {status ?? "—"}
    </span>
  );
}

function NoteModal({ title, label, confirmLabel, onClose, onConfirm, danger }) {
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try { await onConfirm(note); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100] px-6">
      <div className="bg-white rounded-[6px] w-full max-w-[420px] px-7 py-7 relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-[#8A98A3]"><LuX size={18} /></button>
        <h2 className="font-serif text-[18px] font-medium mb-5">{title}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-[12px] text-[#5C7080] mb-1.5">{label}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              rows={3}
              className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#9C7A3C] resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60 ${danger ? "bg-[#8B4A3D] text-white" : "bg-[#1C2630] text-[#FAF8F4]"}`}
          >
            {isSaving ? "Saving…" : confirmLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 bg-[#E8E3DA] rounded-[3px] animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return <p className="py-10 text-center text-[13px] text-[#8A98A3]">{text}</p>;
}

function formatDate(val) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function ResultsPage() {
  return (
    <ProtectedRoute allowedRoles={["principal", "form_teacher"]}>
      <ResultsContent />
    </ProtectedRoute>
  );
}