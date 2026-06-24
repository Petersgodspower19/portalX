"use client";
import { LuArrowRight } from "react-icons/lu";

const stats = [
  { label: "Results awaiting approval", value: "7", flag: "3 classes pending", tone: "amber" },
  { label: "Unpaid invoices", value: "112", unit: "of 480", flag: "₦5.6m outstanding", tone: "rust" },
  { label: "Enrolled students", value: "480", flag: "across 16 classes", tone: "quiet" },
  { label: "Active staff", value: "34", flag: "1 awaiting first login", tone: "quiet" },
];

const pendingResults = [
  { class: "JSS1A", subject: "Mathematics", by: "Mrs Adeyemi", students: 28, submitted: "2 days ago" },
  { class: "SSS2B", subject: "English Language", by: "Mr Okonkwo", students: 31, submitted: "2 days ago" },
  { class: "JSS3A", subject: "Basic Science", by: "Mrs Bello", students: 26, submitted: "Yesterday" },
];

const feeStatus = [
  { class: "JSS1A", students: 28, paid: 24, pct: 86 },
  { class: "JSS2B", students: 30, paid: 14, pct: 47 },
  { class: "SSS1A", students: 25, paid: 25, pct: 100 },
  { class: "SSS3B", students: 22, paid: 9, pct: 41 },
];

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

function feeTone(pct) {
  return pct >= 70
    ? "bg-[#EAEFE6] text-[#5E7A5E]"
    : "bg-[#F3E7E3] text-[#8B4A3D]";
}

export default function DashboardPage() {
  return (
    <div>
      <div className="flex justify-between items-end mb-1.5">
        <div>
          <h1 className="font-serif text-[27px] font-medium">Dashboard</h1>
          <p className="text-[12.5px] text-[#5C7080] mt-1">First Term · 2024/2025 session</p>
        </div>
        <div className="font-mono text-[12px] text-[#5C7080] border border-[#DCD5C7] rounded-[3px] px-3 py-1.5 bg-white">
          SESSION 2024/2025 — TERM 1
        </div>
      </div>

      <div className="border-b border-[#DCD5C7] my-5" />

      <div className="grid grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`px-6 ${i !== 0 ? "border-l border-[#DCD5C7]" : "pl-0"}`}>
            <div className="text-[11px] uppercase tracking-[0.07em] text-[#5C7080] mb-2.5">{s.label}</div>
            <div className="font-serif text-[32px] font-medium">
              {s.value}
              {s.unit && <span className="font-sans text-[15px] text-[#5C7080] ml-1">{s.unit}</span>}
            </div>
            <span className={`inline-block mt-2 text-[11.5px] rounded-[3px] px-1.5 py-0.5 ${flagStyles[s.tone]}`}>
              {s.flag}
            </span>
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
                  className={`text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7] ${
                    i === 3 ? "text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pendingResults.map((r) => (
              <tr key={r.class + r.subject}>
                <td className="py-3.5 border-b border-[#DCD5C7] text-[13.5px]">{r.class}</td>
                <td className="py-3.5 border-b border-[#DCD5C7] text-[13.5px]">{r.subject}</td>
                <td className="py-3.5 border-b border-[#DCD5C7] text-[13.5px]">{r.by}</td>
                <td className="py-3.5 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080] text-right">{r.students}</td>
                <td className="py-3.5 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080]">{r.submitted}</td>
                <td className="py-3.5 border-b border-[#DCD5C7] text-right">
                  <button className="text-[12px] font-medium border border-[#DCD5C7] bg-white rounded-[3px] px-3 py-1.5">
                    Review
                  </button>
                  <button className="text-[12px] font-medium bg-[#1C2630] text-[#FAF8F4] rounded-[3px] px-3 py-1.5 ml-2">
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-9 mt-10">
        <div>
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="font-serif text-[18px] font-medium">Fee status by class</h2>
            <a href="/fees" className="text-[12.5px] text-[#9C7A3C] border-b border-[#C9B68A] pb-0.5 flex items-center gap-1">
              Fees module <LuArrowRight size={12} />
            </a>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Class", "Students", "Paid", "Status"].map((h, i) => (
                  <th
                    key={h}
                    className={`text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7] ${
                      i === 1 || i === 2 ? "text-right" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {feeStatus.map((f) => (
                <tr key={f.class}>
                  <td className="py-3.5 border-b border-[#DCD5C7] text-[13.5px]">{f.class}</td>
                  <td className="py-3.5 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080] text-right">{f.students}</td>
                  <td className="py-3.5 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080] text-right">{f.paid}</td>
                  <td className="py-3.5 border-b border-[#DCD5C7]">
                    <span className={`inline-block text-[11px] font-medium rounded-[3px] px-2 py-0.5 ${feeTone(f.pct)}`}>
                      {f.pct}% paid
                    </span>
                  </td>
                </tr>
              ))}
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