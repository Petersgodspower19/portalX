"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { LuCheck, LuCircleAlert, LuClock3, LuRefreshCw, LuUserCheck, LuX } from "react-icons/lu";
import { approveStudentForClass, rejectStudentForClass } from "@/app/_lib/classes";
import styles from "./pending-students.module.css";

const registeredDate = (value) => value ? new Date(value).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", dateStyle: "medium" }) : "Not provided";

export default function PendingStudents({ classId, query }) {
  const queryClient = useQueryClient();
  const [rejectStudent, setRejectStudent] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [error, setError] = useState("");
  const students = Array.isArray(query.data) ? query.data : [];
  const malformed = !query.isPending && !query.isError && !Array.isArray(query.data);
  const busy = !!approvingId || !!rejectStudent;

  async function refreshLists() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["pending-class-students", classId] }),
      queryClient.invalidateQueries({ queryKey: ["students"] }),
      queryClient.invalidateQueries({ queryKey: ["class-registration-code", classId] }),
    ]);
  }
  async function approve(student) {
    if (busy) return;
    setApprovingId(student.id); setError("");
    try {
      const response = await approveStudentForClass(classId, student.id);
      await refreshLists();
      toast.success(`${student.name} approved.${response?.reg_number ? ` Registration number: ${response.reg_number}` : ""}`);
    } catch (failure) { setError(failure.message || "Could not approve this registration."); }
    finally { setApprovingId(null); }
  }
  async function reject(reason) {
    await rejectStudentForClass(classId, rejectStudent.id, reason);
    await refreshLists();
    setRejectStudent(null);
    toast.success("Student registration rejected.");
  }

  return <section className={styles.panel}>
    <div className={styles.heading}><div><span className={styles.eyebrow}>Student admissions</span><h2>Awaiting your approval</h2><p>Check each student’s details before accepting them into your class.</p></div><button className={styles.secondary} onClick={() => query.refetch()} disabled={busy || query.isFetching}><LuRefreshCw size={14} />Refresh</button></div>
    {error && <div className={styles.error} role="alert"><LuCircleAlert size={16} />{error}</div>}
    {query.isPending ? <p className={styles.loading} role="status">Loading pending registrations...</p> : query.isError || malformed ? <div className={styles.error} role="alert"><LuCircleAlert size={17} /><div><strong>Could not load pending students</strong><p>{query.error?.message || "The response could not be displayed. Please try again."}</p><button className={styles.retry} onClick={() => query.refetch()} disabled={query.isFetching}>Try again</button></div></div> : !students.length ? <div className={styles.empty}><span><LuUserCheck size={27} /></span><h3>All registrations reviewed</h3><p>New students awaiting approval will appear here after they register with your class code.</p></div> : <>
      <div className={styles.summary}><LuClock3 size={15} /><span>{students.length} {students.length === 1 ? "registration" : "registrations"} awaiting review</span></div>
      <div className={styles.tableWrap}><table><thead><tr><th>Student</th><th>Guardian contact</th><th>School file</th><th>Registered</th><th>Decision</th></tr></thead><tbody>{students.map((student) => <tr key={student.id}>
        <td><strong>{student.name}</strong><span className={styles.detail}>{student.username ? `@${student.username}` : "Username not provided"}</span><span className={styles.detail}><span className={styles.capitalize}>{student.gender}</span>{student.date_of_birth ? ` / Born ${student.date_of_birth}` : ""}</span></td>
        <td><strong>{student.guardian_name}</strong><span className={styles.detail}>{student.guardian_phone}</span>{student.guardian_email && <span className={styles.detail}>{student.guardian_email}</span>}</td>
        <td>{student.school_file_number || "Not provided"}</td><td>{registeredDate(student.created_at)}</td>
        <td><div className={styles.actions}><button className={styles.primary} disabled={busy || query.isFetching} onClick={() => approve(student)}><LuCheck size={14} />{approvingId === student.id ? "Approving..." : "Approve"}</button><button className={styles.reject} disabled={busy || query.isFetching} onClick={() => { setError(""); setRejectStudent(student); }}><LuX size={14} />Reject</button></div></td>
      </tr>)}</tbody></table></div>
    </>}
    {rejectStudent && <RejectStudentDialog student={rejectStudent} onClose={() => setRejectStudent(null)} onConfirm={reject} />}
  </section>;
}

function RejectStudentDialog({ student, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector("textarea")?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  function onKeyDown(event) {
    if (event.key === "Escape" && !saving) onClose();
    if (event.key !== "Tab") return;
    const elements = [...ref.current.querySelectorAll("button:not(:disabled), textarea:not(:disabled)")];
    if (!elements.length) { event.preventDefault(); return; }
    if (event.shiftKey && (document.activeElement === elements[0] || document.activeElement === ref.current)) { event.preventDefault(); elements.at(-1).focus(); }
    else if (!event.shiftKey && (document.activeElement === elements.at(-1) || document.activeElement === ref.current)) { event.preventDefault(); elements[0].focus(); }
  }
  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    if (reason.trim().length < 5) { setError("Enter a rejection reason of at least 5 characters."); return; }
    setSaving(true); setError("");
    try { await onConfirm(reason.trim()); }
    catch (failure) { setError(failure.message || "Could not reject this registration. Please try again."); }
    finally { setSaving(false); }
  }
  return <div className={styles.overlay}><section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className={styles.dialog} onKeyDown={onKeyDown}>
    <button className={styles.close} onClick={onClose} disabled={saving} aria-label="Close rejection dialog"><LuX size={19} /></button>
    <span className={styles.dialogIcon}><LuUserCheck size={24} /></span><h2 id={titleId}>Reject student registration?</h2><p id={descriptionId}>You are rejecting <strong>{student.name}</strong>. Explain why this registration cannot be approved.</p>
    <form onSubmit={submit}><label className={styles.reason}>Reason for rejection<textarea required minLength={5} rows={4} value={reason} disabled={saving} onChange={(event) => setReason(event.target.value)} placeholder="Explain what is incorrect or missing..." aria-describedby={error ? errorId : undefined} aria-invalid={error ? true : undefined} /></label><p className={styles.hint}>Use at least 5 characters and give a clear explanation.</p>
      {error && <div id={errorId} role="alert" className={styles.error}>{error}</div>}
      <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={onClose} disabled={saving}>Cancel</button><button className={styles.rejectConfirm} disabled={saving || reason.trim().length < 5}>{saving ? "Rejecting..." : "Reject registration"}</button></div>
    </form>
  </section></div>;
}
