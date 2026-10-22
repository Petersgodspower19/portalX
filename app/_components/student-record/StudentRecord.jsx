"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { LuArrowLeft, LuArrowRightLeft, LuCreditCard, LuUserX, LuX } from "react-icons/lu";
import { useAuth } from "@/app/_lib/AuthContext";
import { useClasses, useStudent, useGetTerm, useStudentFeeStatus } from "@/app/_lib/hooks";
import { deactivateStudent, transferStudentToAnotherClass } from "@/app/_lib/students";
import { styles, ProfileHeader, Overview, Panel, Metrics, InvoiceTable, State, money, studentName, studentClass } from "./ProfileUI";

export default function StudentRecord({ fromClass = false }) {
  const { id } = useParams();
  const { user } = useAuth();
  const studentQuery = useStudent(id);
  const { data: term } = useGetTerm();
  const queryClient = useQueryClient();
  const [action, setAction] = useState(null);
  const canManage = ["principal", "vice_principal"].includes(user?.role);
  const student = studentQuery.data;
  const back = fromClass ? "/my-class" : "/students";
  async function changed() {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ["student", id] }), queryClient.invalidateQueries({ queryKey: ["students"] }), queryClient.invalidateQueries({ queryKey: ["student-fee-status", id] })]);
    setAction(null);
  }
  return <section className={styles.page}>
    <div className={styles.topline}><nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href={back}><LuArrowLeft size={13} style={{ display: "inline", marginRight: 7 }} />{fromClass ? "My class" : "Students"}</Link><span>/</span><span>Student record</span></nav><span className={styles.recordLabel}>School records</span></div>
    {studentQuery.isPending ? <State title="Loading student record" description="Getting the latest student and class details." loading /> : studentQuery.isError || !student ? <State title="Student record unavailable" description={studentQuery.error?.message || "This record could not be found."} error onRetry={studentQuery.refetch} /> : <>
      <ProfileHeader student={student} term={term} title={fromClass ? "Class student record" : "Student record"} actions={canManage && <><button className={styles.secondary} onClick={() => setAction("transfer")}><LuArrowRightLeft size={14} />Transfer class</button>{student.is_active !== false && <button className={styles.danger} onClick={() => setAction("deactivate")}><LuUserX size={14} />Deactivate</button>}</>} />
      <Overview student={student} />
      {canManage && <div className={styles.sectionSpace}><StudentFees studentId={student.id} term={term} /></div>}
      <p className={styles.footnote}>Student information is maintained by the school. Review the current record before making changes to class placement or enrolment.</p>
      {action && <RecordAction action={action} student={student} onClose={() => setAction(null)} onChanged={changed} />}
    </>}
  </section>;
}

function StudentFees({ studentId, term }) {
  const query = useStudentFeeStatus(studentId, term?.id);
  if (!term) return <Panel title="Fees and payments" description="Current-term account summary" icon={LuCreditCard}><State title="No current term" description="Fee information will appear when a current term is available." /></Panel>;
  return <Panel title="Fees and payments" description={`Account summary for ${term.name}`} icon={LuCreditCard}>
    {query.isPending ? <State title="Loading fee information" loading /> : query.isError ? <State title="Fee information unavailable" description={query.error.message} error onRetry={query.refetch} /> : !query.data ? <State title="No fee information" description="There is no fee summary available for this term." /> : <>
      <div style={{ padding: "24px 24px 0" }}><Metrics items={[{ label: "Total billed", value: money(query.data.total_owed) }, { label: "Total paid", value: money(query.data.total_paid) }, { label: "Payment status", value: <span style={{ fontSize: 15, textTransform: "capitalize" }}>{query.data.status || "Not available"}</span> }]} /></div>
      {query.data.invoices?.length ? <InvoiceTable invoices={query.data.invoices} /> : <State title="No invoices listed" description="No invoices were returned for this student and term." />}
    </>}
  </Panel>;
}

function RecordAction({ action, student, onClose, onChanged }) {
  const transfer = action === "transfer";
  const classes = useClasses();
  const [classId, setClassId] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const options = (Array.isArray(classes.data) ? classes.data : classes.data?.classes ?? []).filter((item) => item.id !== (student.class_id || student.class_info?.id));
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  function keydown(event) {
    if (event.key === "Escape" && !saving) onClose();
    if (event.key !== "Tab") return;
    const elements = [...dialog.current.querySelectorAll("button:not(:disabled), select:not(:disabled), textarea:not(:disabled)")];
    if (!elements.length) { event.preventDefault(); return; }
    if (event.shiftKey && (document.activeElement === elements[0] || document.activeElement === dialog.current)) { event.preventDefault(); elements.at(-1).focus(); }
    else if (!event.shiftKey && (document.activeElement === elements.at(-1) || document.activeElement === dialog.current)) { event.preventDefault(); elements[0].focus(); }
  }
  async function submit(event) {
    event.preventDefault();
    if (saving || !reason.trim() || (transfer && !classId)) return;
    setSaving(true); setError("");
    try {
      if (transfer) await transferStudentToAnotherClass(classId, reason.trim(), student.id);
      else await deactivateStudent(student.id, reason.trim());
      await onChanged(); toast.success(transfer ? "Student transferred successfully." : "Student deactivated.");
    } catch (failure) { setError(failure.message || "Could not update this student record."); }
    finally { setSaving(false); }
  }
  return <div className={styles.overlay}><section ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} onKeyDown={keydown} className={styles.dialog}>
    <button className={styles.close} onClick={onClose} disabled={saving} aria-label="Close dialog"><LuX size={19} /></button><span className={styles.eyebrow}>Student administration</span><h2 id={titleId} style={{ marginTop: 14 }}>{transfer ? "Transfer class" : "Deactivate student"}</h2><p id={descriptionId}>{studentName(student)}<br />{transfer ? `Current class: ${studentClass(student)}` : "This will mark the student's record as inactive. Provide a reason for this change."}</p>
    <form onSubmit={submit}>{transfer && <label className={styles.formLabel}>New class<select required disabled={saving || classes.isPending || classes.isError} value={classId} onChange={(event) => setClassId(event.target.value)}><option value="">{classes.isPending ? "Loading classes..." : "Select a class"}</option>{options.map((item) => <option key={item.id} value={item.id}>{item.full_name || [item.name, item.arm].filter(Boolean).join(" ")}</option>)}</select>{classes.isError && <small>Classes could not be loaded. <button type="button" onClick={() => classes.refetch()}>Try again</button></small>}</label>}
      <label className={styles.formLabel}>Reason<textarea required rows={4} value={reason} onChange={(event) => setReason(event.target.value)} disabled={saving} placeholder="Explain the reason for this change." /></label>
      {error && <p className={styles.inlineError} role="alert">{error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={onClose} disabled={saving}>Cancel</button><button className={transfer ? styles.primary : styles.dangerConfirm} disabled={saving || !reason.trim() || (transfer && (!classId || classes.isError || classes.isPending))}>{saving ? "Saving..." : transfer ? "Confirm transfer" : "Deactivate student"}</button></div>
    </form>
  </section></div>;
}
