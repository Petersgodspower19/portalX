"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { LuArrowRight, LuCheck, LuCircleAlert, LuDownload, LuFileSpreadsheet, LuFileUp, LuLockKeyhole, LuRefreshCw, LuSend, LuShieldCheck, LuX } from "react-icons/lu";
import { useAuth } from "../../_lib/AuthContext";
import ProtectedRoute from "../../_lib/ProtectedRoutes";
import { useGetTerm } from "../../_lib/hooks";
import { getMyClass, listClasses } from "../../_lib/classes";
import { downloadClassResultTemplate, uploadClassResults, getClassSubmission, submitClassResults, approveClassResults, rejectClassResults, getAllPendingResults, getResultsForClass, lockTerm, unlockTerm } from "../../_lib/results";
import styles from "./results.module.css";

const statusName = (value) => String(value ?? "").toLowerCase();
const className = (item) => item?.full_name || [item?.name, item?.arm].filter(Boolean).join(" ") || "Your class";
const date = (value) => value ? new Date(value).toLocaleString("en-GB", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" }) : "Not yet";
function rowsFrom(data) {
  const rows = Array.isArray(data) ? data : data?.results;
  if (!Array.isArray(rows)) throw new Error("The results could not be displayed. Please refresh or contact your administrator.");
  return rows;
}
function Status({ value }) {
  const status = statusName(value);
  const labels = { draft: "Draft", submitted: "Awaiting review", approved: "Approved", rejected: "Needs correction" };
  return <span className={styles.badge} data-status={status}>{labels[status] || value || "No submission"}</span>;
}
function Message({ children, error = false, onRetry }) {
  return <div className={error ? styles.error : styles.notice} role={error ? "alert" : "status"}><LuCircleAlert size={17} /><div>{children}</div>{onRetry && <button className={styles.link} onClick={onRetry}>Try again</button>}</div>;
}
function Empty({ title, children }) {
  return <div className={styles.empty}><LuFileSpreadsheet size={30} /><h3>{title}</h3><p>{children}</p></div>;
}

function ResultsContent() {
  const { user } = useAuth();
  const principal = user?.role === "principal";
  const teacher = user?.role === "form_teacher";
  const termQuery = useGetTerm();
  const term = termQuery.data;
  const classesQuery = useQuery({ queryKey: teacher ? ["class"] : ["classes"], queryFn: teacher ? getMyClass : () => listClasses(), retry: false });
  const classes = teacher ? classesQuery.data ? [classesQuery.data] : [] : Array.isArray(classesQuery.data) ? classesQuery.data : classesQuery.data?.classes ?? [];
  const [selectedClass, setSelectedClass] = useState("");
  const [tab, setTab] = useState(teacher ? "class" : "pending");
  const [busy, setBusy] = useState(false);
  const selected = teacher ? classes[0] : classes.find((item) => item.id === selectedClass);
  const queryClient = useQueryClient();
  const pending = useQuery({ queryKey: ["pending-results"], queryFn: async () => rowsFrom(await getAllPendingResults()), enabled: !teacher, retry: false });
  // The pending endpoint lists subject combinations. Show a single review entry per class.
  const queue = [...new Map((pending.data ?? []).filter((item) => !item.term_id || item.term_id === term?.id).map((item) => [item.class_id, item])).values()];
  async function refresh() {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ["class-submission"] }), queryClient.invalidateQueries({ queryKey: ["class-results"] }), queryClient.invalidateQueries({ queryKey: ["pending-results"] }), queryClient.invalidateQueries({ queryKey: ["term"] }), queryClient.invalidateQueries({ queryKey: ["my-results"] })]);
  }
  return <div className={styles.page}>
    <header className={styles.header}><div><span className={styles.eyebrow}>Academics / Results</span><h1>{teacher ? "Your class results" : "Results workspace"}</h1><p>{teacher ? "One class file. A clear path from draft to approval." : "Review class submissions and keep every result on track."}</p></div><button className={styles.secondary} onClick={refresh} disabled={busy}><LuRefreshCw size={15} />Refresh</button></header>
    {termQuery.isPending || classesQuery.isPending ? <div className={styles.loading} role="status">Loading your results workspace...</div> : termQuery.isError ? <Message error onRetry={termQuery.refetch}>{termQuery.error.message}</Message> : !term ? <Empty title="No current term">Ask your school administrator to set the current term before working on results.</Empty> : classesQuery.isError ? <Message error onRetry={classesQuery.refetch}>{classesQuery.error.message}</Message> : <>
      <div className={styles.context}><div><span className={styles.contextIcon}><LuFileSpreadsheet size={21} /></span><div><small>Current term</small><strong>{term.name}</strong></div></div><div className={styles.contextRight}><span className={styles.termState}><LuLockKeyhole size={13} />{term.is_locked ? "Term locked" : "Open for results"}</span>{principal && <TermControl term={term} onChanged={refresh} busy={busy} setBusy={setBusy} />}</div></div>
      {!teacher && <nav className={styles.tabs} aria-label="Results views"><button aria-pressed={tab === "pending"} onClick={() => setTab("pending")} disabled={busy}>Awaiting review <span>{pending.data ? queue.length : "—"}</span></button><button aria-pressed={tab === "class"} onClick={() => setTab("class")} disabled={busy}>Class workspace</button></nav>}
      {!teacher && tab === "pending" ? <section className={styles.card}><div className={styles.cardHeading}><div><h2>Ready for your review</h2><p>Open a class to check its scores before making a decision.</p></div><LuShieldCheck size={23} /></div>
        {pending.isPending ? <p className={styles.loading}>Loading submissions...</p> : pending.isError ? <Message error onRetry={pending.refetch}>{pending.error.message}</Message> : !queue.length ? <Empty title="You’re all caught up">No class results are awaiting review for this term.</Empty> : <div className={styles.tableWrap}><table><thead><tr><th>Class</th><th>Status</th><th>Submitted</th><th><span className={styles.srOnly}>Actions</span></th></tr></thead><tbody>{queue.map((item) => <tr key={item.class_id}><td><strong>{item.class_name || className(classes.find((c) => c.id === item.class_id))}</strong></td><td><Status value="submitted" /></td><td>{date(item.submitted_at)}</td><td><button className={styles.secondary} disabled={!classes.some((c) => c.id === item.class_id)} onClick={() => { setSelectedClass(item.class_id); setTab("class"); }}>Review class<LuArrowRight size={14} /></button></td></tr>)}</tbody></table></div>}
      </section> : <>
        {!teacher && <div className={styles.selector}><label htmlFor="results-class">Choose a class</label><select id="results-class" value={selectedClass} disabled={busy} onChange={(event) => setSelectedClass(event.target.value)}><option value="">Select a class to get started</option>{classes.map((item) => <option key={item.id} value={item.id}>{className(item)}</option>)}</select><span>Viewing {term.name}</span></div>}
        {selected ? <ClassWorkspace key={`${selected.id}:${term.id}`} selected={selected} term={term} principal={principal} canUpload={teacher || principal} onChanged={refresh} busy={busy} setBusy={setBusy} /> : <section className={styles.card}><Empty title={teacher ? "No class assigned yet" : "Every class, one clear view"}>{teacher ? "Contact your school administrator to assign your class." : "Select a class to view its submission, review scores, or prepare an upload."}</Empty></section>}
      </>}
    </>}
  </div>;
}

function ClassWorkspace({ selected, term, principal, canUpload, onChanged, busy, setBusy }) {
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [reason, setReason] = useState("");
  const [format, setFormat] = useState("xlsx");
  const [reviewedVersion, setReviewedVersion] = useState(null);
  const [action, setAction] = useState(null);
  const [actionError, setActionError] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const fileRef = useRef(null);
  const submission = useQuery({ queryKey: ["class-submission", selected.id, term.id], queryFn: () => getClassSubmission(selected.id, term.id), retry: false });
  const results = useQuery({ queryKey: ["class-results", selected.id, term.id], queryFn: async () => rowsFrom(await getResultsForClass(selected.id, term.id)), enabled: !!submission.data, retry: false });
  const data = submission.data;
  const status = statusName(data?.status);
  const reviewVersion = data ? `${data.submission_id}:${data.version}` : null;
  const reviewed = !!reviewVersion && reviewedVersion === reviewVersion;
  const editable = !term.is_locked && (!data || ["draft", "rejected"].includes(status));
  const ready = !submission.isPending && !submission.isError && !submission.isFetching;
  const rows = results.data ?? [];
  const canSubmit = ready && status === "draft" && reviewed && rows.length > 0 && !results.isError && !results.isFetching;
  async function download() {
    setBusy(true); setActionError("");
    try {
      const blob = await downloadClassResultTemplate(selected.id, term.id, format);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url;
      anchor.download = `results-${className(selected).replace(/[^a-z0-9-]/gi, "-")}-${term.name.replace(/[^a-z0-9-]/gi, "-")}.${format}`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Template downloaded. Fill in the scores, then upload your completed file.");
    } catch (error) { setActionError(error.message); } finally { setBusy(false); }
  }
  async function upload(event) {
    event.preventDefault();
    if (!file || !editable || !ready || busy) return;
    if (principal && reason.trim().length < 5) { setActionError("Tell us why you’re uploading on behalf of the form teacher (at least 5 characters)."); return; }
    setBusy(true); setActionError("");
    try {
      await uploadClassResults(selected.id, term.id, file, principal ? reason : undefined);
      setReviewedVersion(null); setFile(null); setReason(""); setUploadOpen(false);
      if (fileRef.current) fileRef.current.value = "";
      await onChanged(); toast.success("Draft saved. Review the scores below, then submit for review.");
    } catch (error) { setActionError(error.message); } finally { setBusy(false); }
  }
  async function confirm(note) {
    if (action === "submit") await submitClassResults(selected.id, term.id);
    if (action === "approve") await approveClassResults(selected.id, term.id);
    if (action === "reject") await rejectClassResults(selected.id, term.id, note);
    setReviewedVersion(null); setAction(null); await onChanged();
    toast.success(action === "submit" ? "Class results submitted for review." : action === "approve" ? "Class results approved." : "Results returned for correction.");
  }
  const steps = ["Prepare template", "Save a draft", "Submit for review", "Approval"];
  const step = status === "approved" ? 4 : status === "submitted" ? 3 : data ? 2 : 0;
  return <div className={styles.workspace}>
    <div className={styles.workspaceHeading}><div><span className={styles.eyebrow}>Class submission</span><h2>{className(selected)}</h2></div><Status value={data?.status} /></div>
    <ol className={styles.steps}>{steps.map((label, index) => <li key={label} data-complete={index < step}><span>{index < step ? <LuCheck size={13} /> : index + 1}</span>{label}</li>)}</ol>
    {term.is_locked && <Message>This term is locked. Results can be viewed, but changes are disabled until the principal unlocks the term.</Message>}
      {canUpload && <section className={styles.card}><div className={styles.cardHeading}><div><h2>{data ? "Class result file" : "Start with your class template"}</h2><p>Use one file for the class. Keep the template’s columns and student details intact.</p></div><LuFileSpreadsheet size={24} /></div>
        <div className={styles.template}><div><strong>Download a ready-to-fill template</strong><p>Choose Excel or CSV, enter the scores, then save your completed file.</p></div><div className={styles.inline}><select aria-label="Template file format" value={format} disabled={busy} onChange={(event) => setFormat(event.target.value)}><option value="xlsx">Excel (.xlsx)</option><option value="csv">CSV (.csv)</option></select><button className={styles.secondary} onClick={download} disabled={busy}><LuDownload size={15} />Download template</button></div></div>
        {ready && editable && (data && !uploadOpen ? <div className={styles.replace}><p>{status === "rejected" ? "Ready to correct your submission?" : "Need to change any scores? Upload a corrected class file."}</p><button className={styles.secondary} onClick={() => setUploadOpen(true)} disabled={busy}>Upload corrected file</button></div> : <form onSubmit={upload} className={styles.upload}>
          <label className={styles.dropzone} htmlFor="class-results-file"><LuFileUp size={27} /><strong>{file ? file.name : "Choose your completed class file"}</strong><span>Excel (.xlsx) or CSV (.csv)</span><input ref={fileRef} id="class-results-file" type="file" accept=".csv,.xlsx" disabled={busy} onChange={(event) => { const chosen = event.target.files?.[0]; setFileError(""); setFile(null); if (chosen && !/\.(csv|xlsx)$/i.test(chosen.name)) { setFileError("Choose a CSV or Excel (.xlsx) file."); event.target.value = ""; } else setFile(chosen ?? null); }} /></label>
          {fileError && <Message error>{fileError}</Message>}
          {principal && <label className={styles.reason}>Reason for uploading on behalf of the teacher<textarea required minLength={5} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} placeholder="Explain why you’re uploading this class’s results." rows={3} /><small>At least 5 characters. This reason accompanies your upload.</small></label>}
          <div className={styles.actionRow}><p>Saving a draft does not submit it for approval.</p><button className={styles.primary} disabled={busy || !file || !ready || (principal && reason.trim().length < 5)}><LuFileUp size={15} />{busy ? "Please wait..." : "Save class draft"}</button></div>
        </form>)}
      </section>}
      {actionError && <Message error>{actionError}</Message>}
    {submission.isPending ? <div className={styles.loading}>Checking this class’s submission...</div> : submission.isError ? <Message error onRetry={submission.refetch}>{submission.error.message}</Message> : <>
      {status === "rejected" && <Message error><strong>Changes requested</strong><p>{data.rejection_reason || "Please check with your reviewer for the required corrections."}</p><p>Correct your class file and upload it again to save a new draft.</p></Message>}
      {status === "submitted" && <Message><strong>Submitted for review</strong><p>{canUpload && !principal ? "Your class results are with school management. You’ll see the decision here." : "Review the class scores below before approving or returning them for correction."}</p></Message>}
      {status === "approved" && <Message><strong>Results approved</strong><p>This class submission has completed review.</p></Message>}
      {data ? <section className={styles.card}>
        <div className={styles.cardHeading}><div><h2>Review class results</h2><p>Check student details, subjects and scores before the next step.</p></div><span className={styles.version}>Version {data.version}</span></div>
        <dl className={styles.metrics}><div><dt>Students</dt><dd>{data.student_count ?? "—"}</dd></div><div><dt>Subjects</dt><dd>{data.subject_count ?? "—"}</dd></div><div><dt>Result entries</dt><dd>{data.result_count ?? "—"}</dd></div></dl>
        <div className={styles.history}><span>Submitted: {date(data.submitted_at)}</span>{data.approved_at && <span>Approved: {date(data.approved_at)}</span>}</div>
        {results.isPending ? <p className={styles.loading}>Loading class scores...</p> : results.isError ? <Message error onRetry={results.refetch}>{results.error.message}</Message> : rows.length ? <div className={styles.tableWrap}><table><thead><tr>{["Student", "Subject", "CA 1", "CA 2", "Exam", "Total", "Grade"].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id ?? `${row.student_id}:${row.subject_id}:${index}`}><td><strong>{row.student_name ?? "—"}</strong><small>{row.reg_number ?? "—"}</small></td><td>{row.subject_name ?? row.subject?.name ?? "—"}</td><td>{row.ca1_score ?? "—"}</td><td>{row.ca2_score ?? "—"}</td><td>{row.exam_score ?? "—"}</td><td><strong>{row.total_score ?? "—"}</strong></td><td><span className={styles.grade}>{row.grade ?? "—"}</span></td></tr>)}</tbody></table></div> : <Empty title="No scores to display">Upload a completed class file or refresh to check the saved results.</Empty>}
        {canUpload && status === "draft" && !term.is_locked && <div className={styles.reviewActions}><label className={styles.checkbox}><input type="checkbox" checked={reviewed} disabled={busy || results.isError || !rows.length} onChange={(event) => setReviewedVersion(event.target.checked ? reviewVersion : null)} /><span>I have reviewed the student details and scores for this class.</span></label><button className={styles.primary} disabled={busy || !canSubmit} onClick={() => setAction("submit")}><LuSend size={15} />Submit for review</button></div>}
        {(principal || !canUpload) && status === "submitted" && !term.is_locked && <div className={styles.reviewActions}><p>{principal ? "Your decision applies to this whole class submission." : "Return this submission with a reason if corrections are needed. Only the principal can approve."}</p><div className={styles.inline}><button className={styles.danger} disabled={busy || !ready || results.isError || results.isFetching || !rows.length} onClick={() => setAction("reject")}>Return for correction</button>{principal && <button className={styles.primary} disabled={busy || !ready || results.isError || results.isFetching || !rows.length} onClick={() => setAction("approve")}><LuCheck size={15} />Approve class results</button>}</div></div>}
      </section> : !canUpload && <section className={styles.card}><Empty title="No submission yet">The form teacher has not uploaded results for this class and term.</Empty></section>}
    </>}
    {action && <ActionDialog title={action === "submit" ? "Submit class results?" : action === "approve" ? "Approve class results?" : "Return results for correction"} description={`${className(selected)} / ${term.name}. ${action === "submit" ? "Your saved draft will be sent to school management for review." : action === "approve" ? "Confirm that you have checked the scores. This approves the whole class submission." : "Explain what the teacher needs to correct before resubmitting."}`} needsReason={action === "reject"} confirmLabel={action === "submit" ? "Submit for review" : action === "approve" ? "Approve results" : "Return for correction"} onClose={() => setAction(null)} onConfirm={confirm} setBusy={setBusy} />}
  </div>;
}

function TermControl({ term, onChanged, busy, setBusy }) {
  const [open, setOpen] = useState(false);
  async function confirm(reason) {
    if (term.is_locked) await unlockTerm(term.id, reason); else await lockTerm(term.id);
    setOpen(false); await onChanged(); toast.success(term.is_locked ? "Term unlocked." : "Term locked.");
  }
  return <><button className={styles.secondary} disabled={busy} onClick={() => setOpen(true)}><LuLockKeyhole size={14} />{term.is_locked ? "Unlock term" : "Lock term"}</button>{open && <ActionDialog title={term.is_locked ? "Unlock this term?" : "Lock this term?"} description={term.is_locked ? `Allow changes to ${term.name}. Please explain why the term needs to be reopened.` : `Locking ${term.name} prevents further changes to its results. You can unlock it later with a reason.`} needsReason={term.is_locked} confirmLabel={term.is_locked ? "Unlock term" : "Lock term"} onClose={() => setOpen(false)} onConfirm={confirm} setBusy={setBusy} />}</>;
}

function ActionDialog({ title, description, needsReason, confirmLabel, onClose, onConfirm, setBusy }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  function keydown(event) {
    if (event.key === "Escape" && !saving) onClose();
    if (event.key === "Tab") {
      const nodes = [...dialog.current.querySelectorAll('button:not(:disabled), textarea:not(:disabled)')];
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!nodes.length) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (saving || (needsReason && !reason.trim())) return;
    setSaving(true); setBusy(true); setError("");
    try { await onConfirm(reason.trim()); } catch (failure) { setError(failure.message); } finally { setSaving(false); setBusy(false); }
  }
  return <div className={styles.overlay}><section ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className={styles.dialog} onKeyDown={keydown}>
    <button className={styles.close} onClick={onClose} disabled={saving} aria-label="Close dialog"><LuX size={19} /></button><span className={styles.dialogIcon}><LuShieldCheck size={25} /></span><h2 id={titleId}>{title}</h2><p id={descriptionId}>{description}</p>
    <form onSubmit={submit}>{needsReason && <label className={styles.reason}>Reason<textarea required rows={4} value={reason} onChange={(event) => setReason(event.target.value)} disabled={saving} placeholder="Describe the reason clearly..." /></label>}{error && <Message error>{error}</Message>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={onClose} disabled={saving}>Cancel</button><button className={styles.primary} disabled={saving || (needsReason && !reason.trim())}>{saving ? "Saving..." : confirmLabel}</button></div></form>
  </section></div>;
}

export default function ResultsPage() {
  return <ProtectedRoute allowedRoles={["principal", "vice_principal", "form_teacher"]}><ResultsContent /></ProtectedRoute>;
}
