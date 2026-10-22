"use client";

import { useState } from "react";
import { LuUserRound, LuChartNoAxesColumn, LuCreditCard, LuGraduationCap } from "react-icons/lu";
import ProtectedRoute from "@/app/_lib/ProtectedRoutes";
import { useLoggedInStudent, useGetTerm, useStudentResults, useStudentInvoice } from "@/app/_lib/hooks";
import { styles, ProfileHeader, Overview, Panel, Metrics, InvoiceTable, State, money } from "@/app/_components/student-record/ProfileUI";

const tabs = [{ key: "profile", label: "Profile overview", icon: LuUserRound }, { key: "results", label: "Academic results", icon: LuChartNoAxesColumn }, { key: "fees", label: "Fees and payments", icon: LuCreditCard }];

function StudentContent() {
  const student = useLoggedInStudent();
  const termQuery = useGetTerm();
  const term = termQuery.data;
  const results = useStudentResults(term?.id);
  const invoices = useStudentInvoice(term?.id);
  const [tab, setTab] = useState("profile");
  return <section className={styles.page}>
    <div className={styles.topline}><div className={styles.breadcrumb}><span>Student workspace</span><span>/</span><span>My profile</span></div><span className={styles.recordLabel}>Your school record</span></div>
    {student.isPending ? <State title="Loading your profile" description="Getting your school record ready." loading /> : student.isError || !student.data ? <State title="Your profile could not be loaded" description={student.error?.message || "Please try again to load your student record."} error onRetry={student.refetch} /> : <>
      <ProfileHeader student={student.data} term={term} title="My student profile" />
      <nav className={styles.tabs} aria-label="Student profile views">{tabs.map(({ key, label, icon: Icon }) => <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)}><Icon size={15} />{label}</button>)}</nav>
      {tab === "profile" && <Overview student={student.data} />}
      {tab !== "profile" && (termQuery.isPending ? <State title="Loading the current term" loading /> : termQuery.isError ? <State title="Term information unavailable" description={termQuery.error.message} error onRetry={termQuery.refetch} /> : !term ? <State title="No current term" description="Your results and fees will appear when the school sets a current term." /> : tab === "results" ? <ResultsView query={results} term={term} /> : <FeesView query={invoices} term={term} />)}
      <p className={styles.footnote}>This information is provided by your school. Contact the school administrator if you need help with your record, results or payments.</p>
    </>}
  </section>;
}

function ResultsView({ query, term }) {
  if (query.isPending) return <State title="Loading academic results" description={`Getting results for ${term.name}.`} loading />;
  if (query.isError) return <State title="Results are currently unavailable" description={query.error.message} error onRetry={query.refetch} />;
  const rows = Array.isArray(query.data) ? query.data : query.data?.subjects ?? query.data?.results;
  if (!Array.isArray(rows)) return <State title="Results are not available yet" description={`Your school has not provided results for ${term.name}. Contact your school if you need help.`} />;
  if (!rows.length) return <State title="No published results" description={`No subject results have been published for ${term.name} yet.`} />;
  const allScores = rows.every((row) => row.total_score != null && Number.isFinite(Number(row.total_score)));
  const average = allScores ? (rows.reduce((sum, row) => sum + Number(row.total_score), 0) / rows.length).toLocaleString("en-NG", { maximumFractionDigits: 1 }) : "Not available";
  return <>
    <div className={styles.contentHeading}><div><h2>Academic results</h2><p>Your published subject scores for {term.name}.</p></div></div>
    <Metrics items={[{ label: "Subjects", value: rows.length }, { label: "Average score", value: average, detail: "Across the subjects shown below" }, { label: "Term", value: <span style={{ fontSize: 17 }}>{term.name}</span> }]} />
    <Panel title="Subject performance" description="Continuous assessment and examination scores" icon={LuGraduationCap}><div className={styles.tableWrap}><table><thead><tr>{["Subject", "CA 1", "CA 2", "Exam", "Total", "Grade"].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || row.subject_id || index}><td><strong>{row.subject_name || "Subject"}</strong></td><td className={styles.numeric}>{row.ca1_score ?? "-"}</td><td className={styles.numeric}>{row.ca2_score ?? "-"}</td><td className={styles.numeric}>{row.exam_score ?? "-"}</td><td className={styles.numeric}><strong>{row.total_score ?? "-"}</strong></td><td><span className={styles.grade}>{row.grade || "-"}</span></td></tr>)}</tbody></table></div></Panel>
  </>;
}

function FeesView({ query, term }) {
  if (query.isPending) return <State title="Loading fee information" description={`Getting your invoices for ${term.name}.`} loading />;
  if (query.isError) return <State title="Fee information unavailable" description={query.error.message} error onRetry={query.refetch} />;
  const invoices = Array.isArray(query.data) ? query.data : Array.isArray(query.data?.invoices) ? query.data.invoices : query.data?.id ? [query.data] : [];
  if (!invoices.length) return <State title="No invoices for this term" description={`No fee invoices are listed for ${term.name}.`} />;
  const total = invoices.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const paymentKnown = invoices.every((item) => ["paid", "unpaid"].includes(String(item.status).toLowerCase()) || item.amount_paid != null || item.paid_amount != null);
  const paid = paymentKnown ? invoices.reduce((sum, item) => sum + Number(item.amount_paid ?? item.paid_amount ?? (String(item.status).toLowerCase() === "paid" ? item.amount : 0)), 0) : null;
  return <>
    <div className={styles.contentHeading}><div><h2>Fees and payments</h2><p>A summary of your school invoices for {term.name}.</p></div></div>
    <Metrics items={[{ label: "Total billed", value: money(total) }, { label: "Total paid", value: money(paid) }, { label: "Outstanding balance", value: money(paid === null ? null : total - paid) }]} />
    <Panel title="Invoice history" description={`${invoices.length} ${invoices.length === 1 ? "invoice" : "invoices"} for this term`} icon={LuCreditCard}><InvoiceTable invoices={invoices} /></Panel>
    {!paymentKnown && <p className={styles.footnote}>A payment total is not available for every invoice. Contact the school bursar to confirm the outstanding balance.</p>}
  </>;
}

export default function StudentProfile() {
  return <ProtectedRoute allowedRoles={["student"]}><StudentContent /></ProtectedRoute>;
}
