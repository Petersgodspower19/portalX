"use client";
import { LuArrowRight } from "react-icons/lu";
import { useGetSession, useGetTerm, useStudents, useStaff, useInvoices, usePendingResults, useFeeTypes } from "../../_lib/hooks";

const activity = [
  { action: "Result approved — JSS2A Mathematics", meta: "Ofem Esekpa", time: "10:42" },
  { action: "Invoice marked paid — PX/2025/0118", meta: "Bursar · Mrs Lawal", time: "09:55" },
  { action: "Staff account created — N. Okonkwo", meta: "Ofem Esekpa", time: "Yesterday" },
  { action: "Term locked — First Term 2023/2024", meta: "Ofem Esekpa", time: "3 days ago" },
];

const flagStyles = {
  amber: "bg-[#FAEEDA] text-[#854F0B]",
  rust: "bg-[#F3E7E3] text-[#8B4A3D]",
  quiet: "text-[#8A98A3]",
};

export default function DashboardPage() {
  const { data: session } = useGetSession();
  const { data: term } = useGetTerm();
  const { data: pending = [], isLoading } = usePendingResults();
  const { data: feeTypes = [], isLoading: feesLoading } = useFeeTypes();

  // ── Real data ──────────────────────────────────────────────────────
  const { data: students = [], isLoading: studentsLoading } = useStudents({
    sort_by: "created_at",
    sort_order: "desc",
  });
  const { data: staff = [], isLoading: staffLoading } = useStaff();
  const { data: unpaidInvoices = [], isLoading: unpaidLoading } = useInvoices({
    term_id: term?.id,
    status: "unpaid",
  });
  const { data: allInvoices = [], isLoading: allInvoicesLoading } = useInvoices({
    term_id: term?.id,
  });

  const activeStaff = staff.filter((s) => s.is_active !== false);
  const awaitingFirstLogin = staff.filter((s) => s.is_active !== false && !s.has_logged_in).length;

  // ── Stats ──────────────────────────────────────────────────────────
  const stats = [
    {
      label: "Results awaiting approval",
      value: pending.length,
      flag: pending.length === 1 ? "1 class pending" : `${pending.length} classes pending`,
      tone: "amber",
      loading: isLoading,
    },
    {
      label: "Unpaid invoices",
      value: unpaidInvoices.length,
      unit: allInvoices.length ? `of ${allInvoices.length}` : undefined,
      flag: "this term",
      tone: "rust",
      loading: unpaidLoading || allInvoicesLoading,
    },
    {
      label: "Enrolled students",
      value: students.length,
      flag: "across all classes",
      tone: "quiet",
      loading: studentsLoading,
    },
    {
      label: "Active staff",
      value: activeStaff.length,
      flag: awaitingFirstLogin > 0 ? `${awaitingFirstLogin} awaiting first login` : "all logged in",
      tone: "quiet",
      loading: staffLoading,
    },
  ];

  const sessionLabel = session?.name ?? "—";
  const termLabel = term?.name ?? "—";
  const termPill = session && term ? `${sessionLabel} — ${termLabel}` : "Loading…";
  const pageSubtitle = term && session ? `${termLabel} · ${sessionLabel}` : "Loading current term…";

  return (
    <div>
      <div className="flex justify-between items-end mb-1.5">
        <div>
          <h1 className="font-serif text-[27px] font-medium">Dashboard</h1>
          <p className="text-[12.5px] text-[#5C7080] mt-1">{pageSubtitle}</p>
        </div>
        <div className="font-mono text-[12px] text-[#5C7080] border border-[#DCD5C7] rounded-[3px] px-3 py-1.5 bg-white uppercase tracking-wide">
          {termPill}
        </div>
      </div>

      <div className="border-b border-[#DCD5C7] my-5" />

      <div className="grid grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`px-6 ${i !== 0 ? "border-l border-[#DCD5C7]" : "pl-0"}`}>
            <div className="text-[11px] uppercase tracking-[0.07em] text-[#5C7080] mb-2.5">{s.label}</div>
            {s.loading ? (
              <div className="space-y-2 mt-1">
                <div className="h-9 w-20 bg-[#E8E3DA] rounded-[3px] animate-pulse" />
                <div className="h-4 w-28 bg-[#E8E3DA] rounded-[3px] animate-pulse" />
              </div>
            ) : (
              <>
                <div className="font-serif text-[32px] font-medium">
                  {s.value}
                  {s.unit && <span className="font-sans text-[15px] text-[#5C7080] ml-1">{s.unit}</span>}
                </div>
                <span className={`inline-block mt-2 text-[11.5px] rounded-[3px] px-1.5 py-0.5 ${flagStyles[s.tone]}`}>
                  {s.flag}
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10">
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="font-serif text-[18px] font-medium">Results pending approval</h2>
          <a href="/results" className="text-[12.5px] text-[#9C7A3C] border-b border-[#C9B68A] pb-0.5 flex items-center gap-1">
            View all <LuArrowRight size={12} />
          </a>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Class", "Subject", "Submitted by", "Students", "Submitted", ""].map((h, i) => (
                <th
                  key={h + i}
                  className={`text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7] ${i === 3 ? "text-right" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-6">
                  <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-8 bg-[#E8E3DA] rounded-[3px] animate-pulse" />)}
                  </div>
                </td>
              </tr>
            ) : pending.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[13px] text-[#8A98A3]">No results pending approval.</td>
              </tr>
            ) : (
              pending.map((r) => (
                <tr key={r.class_subject_id ?? r.subject_id + r.class_id}>
                  <td className="py-3.5 border-b border-[#DCD5C7] text-[13.5px]">{r.class_name ?? "—"}</td>
                  <td className="py-3.5 border-b border-[#DCD5C7] text-[13.5px]">{r.subject_name ?? "—"}</td>
                  <td className="py-3.5 border-b border-[#DCD5C7] text-[13.5px] text-[#5C7080]">{r.submitted_by ?? "—"}</td>
                  <td className="py-3.5 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080] text-right">{r.student_count ?? "—"}</td>
                  <td className="py-3.5 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080]">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</td>
                  <td className="py-3.5 border-b border-[#DCD5C7] text-right">
                    <a href="/results" className="text-[12px] font-medium border border-[#DCD5C7] bg-white rounded-[3px] px-3 py-1.5">Review</a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-9 mt-10">
        <div>
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="font-serif text-[18px] font-medium">Fee types this term</h2>
            <a href="/fees" className="text-[12.5px] text-[#9C7A3C] border-b border-[#C9B68A] pb-0.5 flex items-center gap-1">
              Fees module <LuArrowRight size={12} />
            </a>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Fee", "Category", "Amount", "Mandatory"].map((h) => (
                  <th key={h} className="text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {feesLoading ? (
                <tr>
                  <td colSpan={4} className="py-6">
                    <div className="space-y-2">
                      {[1,2,3].map(i => <div key={i} className="h-7 bg-[#E8E3DA] rounded-[3px] animate-pulse" />)}
                    </div>
                  </td>
                </tr>
              ) : feeTypes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[13px] text-[#8A98A3]">No fee types configured.</td>
                </tr>
              ) : (
                feeTypes.filter(f => f.is_active).map((f) => (
                  <tr key={f.id}>
                    <td className="py-3.5 border-b border-[#DCD5C7] text-[13.5px] font-medium">{f.name}</td>
                    <td className="py-3.5 border-b border-[#DCD5C7] text-[13px] capitalize text-[#5C7080]">{f.category}</td>
                    <td className="py-3.5 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080]">
                      ₦{Number(f.amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 border-b border-[#DCD5C7]">
                      {f.is_mandatory
                        ? <span className="inline-block text-[11px] font-medium rounded-[3px] px-2 py-0.5 bg-[#FAEEDA] text-[#854F0B]">Mandatory</span>
                        : <span className="text-[11.5px] text-[#8A98A3]">Optional</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="font-serif text-[18px] font-medium mb-4">Recent activity</h2>
          <div className="border border-[#DCD5C7] rounded-[4px] bg-white px-5 py-1">
            {activity.map((a, i) => (
              <div
                key={a.action}
                className={`flex justify-between py-2.5 ${i !== activity.length - 1 ? "border-b border-[#DCD5C7]" : ""}`}
              >
                <div>
                  <div className="text-[13px]">{a.action}</div>
                  <div className="text-[11.5px] text-[#8A98A3] mt-0.5">{a.meta}</div>
                </div>
                <div className="font-mono text-[11.5px] text-[#8A98A3] whitespace-nowrap">{a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}