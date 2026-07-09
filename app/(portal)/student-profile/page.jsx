'use client'
import { useState } from 'react'
import { useAuth } from '@/app/_lib/AuthContext'
import ProtectedRoute from '@/app/_lib/ProtectedRoutes'
import { useLoggedInStudent, useGetTerm, useStudentResults, useStudentInvoice } from '@/app/_lib/hooks'

function StudentContent() {
  const { user } = useAuth()
  const { data: student, isLoading } = useLoggedInStudent()
  const { data: term } = useGetTerm()
  const { data: invoices = [], isLoading: invoicesLoading } = useStudentInvoice(term?.id)
 const { data: results, isLoading: resultsLoading, isError: resultsError } = useStudentResults(term?.id)
  const [tab, setTab] = useState("profile")

  const initials = `${student?.first_name?.[0] ?? ""}${student?.last_name?.[0] ?? ""}`.toUpperCase()

  return (
    <section>
      <div className="flex justify-between items-end mb-1.5">
        <div>
          <h1 className="font-serif text-[27px] font-medium">My Portal</h1>
          <p className="text-[12.5px] text-[#5C7080] mt-1">
            {student?.class_info?.full_name ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-2.5 border border-[#DCD5C7] rounded-[4px] px-3 py-2 bg-white">
          <div className="bg-[#9C7A3C] h-7 w-7 rounded-full flex items-center justify-center text-[#1C2630] text-[11px] font-semibold shrink-0">
            {initials}
          </div>
          <div className="text-right">
            <p className="text-[13px] font-medium text-[#1C2630]">
              {student?.full_name ?? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`}
            </p>
            <p className="font-mono text-[11px] text-[#5C7080]">{student?.reg_number ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className="border-b border-[#DCD5C7] mt-5 mb-6 flex gap-1">
        {[
          { key: "profile", label: "Profile" },
          { key: "results", label: "Results" },
          { key: "fees", label: "Fees" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-[13px] font-medium px-3.5 py-2.5 border-b-2 -mb-px ${
              tab === t.key ? "border-[#9C7A3C] text-[#1C2630]" : "border-transparent text-[#8A98A3]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileTab student={student} isLoading={isLoading} />}
      {tab === "results" && (
  <ResultsTab results={results} isLoading={resultsLoading} isError={resultsError} term={term} />
)}
      {tab === "fees" && <FeesTab invoices={invoices} isLoading={invoicesLoading} term={term} />}
    </section>
  )
}

/* ── Profile tab ──────────────────────────────────────────────── */
function ProfileTab({ student, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-[#E8E3DA] rounded-[4px] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[720px]">
      <div className="bg-white border border-[#DCD5C7] rounded-[6px] px-6 py-5">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-[#9C7A3C] text-[#1C2630] flex items-center justify-center font-serif font-semibold text-[20px] shrink-0">
            {`${student?.first_name?.[0] ?? ""}${student?.last_name?.[0] ?? ""}`.toUpperCase()}
          </div>
          <div>
            <h2 className="font-serif text-[22px] font-medium leading-tight">{student?.full_name ?? "—"}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="font-mono text-[12.5px] text-[#5C7080]">{student?.reg_number ?? "—"}</span>
              <span className="text-[#DCD5C7]">·</span>
              <span className="text-[12.5px] text-[#5C7080]">{student?.class_info?.full_name ?? "—"}</span>
              <span className={`inline-block text-[11px] font-medium rounded-[3px] px-2 py-0.5 ${
                student?.is_active ? "bg-[#EAEFE6] text-[#5E7A5E]" : "bg-[#F3E7E3] text-[#8B4A3D]"
              }`}>
                {student?.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-[#DCD5C7] rounded-[6px] px-6 py-5">
          <p className="text-[11px] uppercase tracking-[0.07em] text-[#8A98A3] mb-4">Personal details</p>
          <div className="space-y-4">
            <Row label="First name" value={student?.first_name} />
            <Row label="Last name" value={student?.last_name} />
            <Row label="Gender" value={student?.gender} capitalize />
            <Row label="Date of birth" value={formatDate(student?.date_of_birth)} mono />
          </div>
        </div>

        <div className="bg-white border border-[#DCD5C7] rounded-[6px] px-6 py-5">
          <p className="text-[11px] uppercase tracking-[0.07em] text-[#8A98A3] mb-4">Class</p>
          <div className="space-y-4">
            <Row label="Class" value={student?.class_info?.name} />
            <Row label="Arm" value={student?.class_info?.arm} />
            <Row label="Level" value={student?.class_info?.level} />
            <Row label="Full name" value={student?.class_info?.full_name} />
          </div>
        </div>

        <div className="bg-white border border-[#DCD5C7] rounded-[6px] px-6 py-5 col-span-2">
          <p className="text-[11px] uppercase tracking-[0.07em] text-[#8A98A3] mb-4">Guardian details</p>
          <div className="grid grid-cols-3 gap-6">
            <Row label="Name" value={student?.guardian_name} />
            <Row label="Phone" value={student?.guardian_phone} mono />
            <Row label="Email" value={student?.guardian_email} mono />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Fees tab ─────────────────────────────────────────────────── */
function FeesTab({ invoices, isLoading, term }) {
  const invoiceList = Array.isArray(invoices) ? invoices : invoices ? [invoices] : []

  const total = invoiceList.reduce((sum, i) => sum + (i.amount ?? 0), 0)
  const allPaid = invoiceList.length > 0 && invoiceList.every((i) => i.status === "paid")
  const anyUnpaid = invoiceList.some((i) => i.status === "unpaid")

  if (isLoading) {
    return (
      <div className="space-y-3 max-w-[720px]">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-[#E8E3DA] rounded-[4px] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-[720px] space-y-5">
      {/* Summary card */}
      <div className="bg-white border border-[#DCD5C7] rounded-[6px] px-6 py-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.07em] text-[#8A98A3] mb-1">
              {term?.name ?? "Current term"}
            </p>
            <div className="font-serif text-[32px] font-medium text-[#1C2630]">
              ₦{total.toLocaleString()}
            </div>
            <p className="text-[12.5px] text-[#5C7080] mt-1">
              {invoiceList.length} fee line{invoiceList.length !== 1 ? "s" : ""}
            </p>
          </div>
          <span className={`text-[12px] font-medium rounded-[4px] px-3 py-1.5 mt-1 ${
            allPaid
              ? "bg-[#EAEFE6] text-[#5E7A5E]"
              : anyUnpaid
              ? "bg-[#F3E7E3] text-[#8B4A3D]"
              : "bg-[#FAEEDA] text-[#854F0B]"
          }`}>
            {allPaid ? "Fully paid" : anyUnpaid ? "Payment outstanding" : "Overridden"}
          </span>
        </div>
      </div>

      {/* Invoice line items */}
      {invoiceList.length === 0 ? (
        <div className="bg-white border border-[#DCD5C7] rounded-[6px] px-6 py-12 text-center">
          <p className="text-[13px] text-[#8A98A3]">No invoices found for this term.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#DCD5C7] rounded-[6px] overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Fee", "Amount", "Status", "Paid on"].map((h) => (
                  <th key={h} className="text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium px-6 py-3 border-b border-[#DCD5C7]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoiceList.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-6 py-4 border-b border-[#DCD5C7] text-[13.5px] font-medium">
                    {inv.fee_type_name ?? "—"}
                  </td>
                  <td className="px-6 py-4 border-b border-[#DCD5C7] font-mono text-[12.5px] text-[#5C7080]">
                    ₦{Number(inv.amount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 border-b border-[#DCD5C7]">
                    <span className={`inline-block text-[11px] font-medium rounded-[3px] px-2 py-0.5 capitalize ${
                      inv.status === "paid"
                        ? "bg-[#EAEFE6] text-[#5E7A5E]"
                        : inv.status === "unpaid"
                        ? "bg-[#F3E7E3] text-[#8B4A3D]"
                        : "bg-[#FAEEDA] text-[#854F0B]"
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-[#DCD5C7] font-mono text-[12px] text-[#8A98A3]">
                    {inv.paid_at ? formatDate(inv.paid_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#FAF8F4]">
                <td className="px-6 py-3 text-[12px] font-medium text-[#5C7080] uppercase tracking-[0.05em]">Total</td>
                <td className="px-6 py-3 font-mono text-[13px] font-medium text-[#1C2630]">
                  ₦{total.toLocaleString()}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Results tab ──────────────────────────────────────────────── */
function ResultsTab({ results, isLoading, isError, term }) {
  const resultList = results?.subjects ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3 max-w-[720px]">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-[#E8E3DA] rounded-[4px] animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError || !results) {
    return (
      <div className="bg-white border border-[#DCD5C7] rounded-[6px] px-6 py-12 text-center max-w-[720px]">
        <h3 className="font-serif text-[18px] font-medium mb-1">No results yet</h3>
        <p className="text-[13px] text-[#5C7080]">
          Results for {term?.name ?? "this term"} haven't been published yet.
          Check back after your school administrator approves them.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-[720px] space-y-5">
      <div className="bg-white border border-[#DCD5C7] rounded-[6px] overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Subject", "CA1", "CA2", "Exam", "Total", "Grade"].map((h) => (
                <th key={h} className="text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium px-6 py-3 border-b border-[#DCD5C7]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resultList.map((r, i) => (
              <tr key={r.id ?? i}>
                <td className="px-6 py-4 border-b border-[#DCD5C7] text-[13.5px] font-medium">{r.subject_name ?? "—"}</td>
                <td className="px-6 py-4 border-b border-[#DCD5C7] font-mono text-[12.5px] text-[#5C7080]">{r.ca1_score ?? "—"}</td>
                <td className="px-6 py-4 border-b border-[#DCD5C7] font-mono text-[12.5px] text-[#5C7080]">{r.ca2_score ?? "—"}</td>
                <td className="px-6 py-4 border-b border-[#DCD5C7] font-mono text-[12.5px] text-[#5C7080]">{r.exam_score ?? "—"}</td>
                <td className="px-6 py-4 border-b border-[#DCD5C7] font-mono text-[13px] font-medium text-[#1C2630]">{r.total_score ?? "—"}</td>
                <td className="px-6 py-4 border-b border-[#DCD5C7] font-mono text-[13px] text-[#9C7A3C] font-medium">{r.grade ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Shared ───────────────────────────────────────────────────── */
function Row({ label, value, mono, capitalize }) {
  return (
    <div className="flex justify-between items-baseline text-[13px] border-b border-[#F0EBE3] pb-3 last:border-0 last:pb-0">
      <span className="text-[#8A98A3] shrink-0">{label}</span>
      <span className={`text-right ${mono ? "font-mono text-[12.5px] text-[#5C7080]" : "text-[#1C2630] font-medium"} ${capitalize ? "capitalize" : ""}`}>
        {value ?? "—"}
      </span>
    </div>
  )
}

function formatDate(val) {
  if (!val) return "—"
  return new Date(val).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export default function StudentProfile() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentContent />
    </ProtectedRoute>
  )
}