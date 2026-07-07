"use client";
import { useState } from "react";
import { LuUsers, LuBookOpen, LuSearch } from "react-icons/lu";
import { useGetTeachersClass, useGetTerm, useStudents, useAssignedSubjects } from "@/app/_lib/hooks";
import ProtectedRoute from "@/app/_lib/ProtectedRoutes";
import Link from "next/link";
import { CiUser } from "react-icons/ci";

const TABS = [
  { key: "students", label: "Students" },
  { key: "subjects", label: "Subjects" },
];

function MyClassContent() {
  const [tab, setTab] = useState("students");
  const [search, setSearch] = useState("");

  const { data: myClass, isLoading: classLoading, isError } = useGetTeachersClass();
  const { data: term } = useGetTerm();

  const classId = myClass?.id;
  const termId = term?.id;

  const { data: students = [], isLoading: studentsLoading } = useStudents({
    class_id: classId,
    search,
    sort_by: "created_at",
    sort_order: "desc",
  });
  console.log(students);

  const { data: subjects = [], isLoading: subjectsLoading } = useAssignedSubjects(classId, termId);
  console.log(subjects);

  if (classLoading) {
    return <p className="text-[13.5px] text-[#5C7080]">Loading your class…</p>;
  }

  if (isError || !myClass) {
    return (
      <div className="bg-[#F3E7E3] border border-[#DCD5C7] rounded-[6px] px-6 py-5 max-w-[480px]">
        <p className="text-[13.5px] text-[#8B4A3D] font-medium">No class assigned</p>
        <p className="text-[12.5px] text-[#8B4A3D] mt-1">
          You haven't been assigned as a form teacher to any class yet. Contact the principal.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-1.5">
        <h1 className="font-serif text-[27px] font-medium">My class</h1>
        <p className="text-[12.5px] text-[#5C7080] mt-1">
          {term?.name ?? "—"} · {term?.session_name ?? ""}
        </p>
      </div>

      <div className="border-b border-[#DCD5C7] my-5" />

      {/* ── Class card ── */}
      <div className="bg-white border border-[#DCD5C7] rounded-[6px] px-6 py-5 max-w-[680px] mb-7">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-serif text-[22px] font-medium">{myClass.name}</div>
            <div className="text-[12.5px] text-[#5C7080] mt-0.5 capitalize">
              {myClass.level ?? "—"} · Arm {myClass.arm ?? "—"}
            </div>
          </div>
          <div className="flex gap-5">
            <StatChip icon={LuUsers} value={students.length} label="Students" />
            <StatChip icon={LuBookOpen} value={subjects.length} label="Subjects" />
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-[#DCD5C7] mb-6 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-[13px] font-medium px-3.5 py-2.5 border-b-2 -mb-px ${
              tab === t.key
                ? "border-[#9C7A3C] text-[#1C2630]"
                : "border-transparent text-[#8A98A3]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Students tab ── */}
      {tab === "students" && (
        <div>
          <div className="flex items-center gap-2 border border-[#DCD5C7] rounded-[4px] px-3 py-2 bg-white max-w-[280px] mb-5">
            <LuSearch size={14} className="text-[#8A98A3] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students"
              className="text-[13px] outline-none bg-transparent w-full"
            />
          </div>

          {studentsLoading ? (
            <p className="text-[13.5px] text-[#5C7080]">Loading students…</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Name", "Reg number", "Gender", "Status", "..."].map((h) => (
                    <th key={h} className="text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 border-b border-[#DCD5C7] text-[13.5px]">
                      {s.first_name} {s.last_name}
                    </td>
                    <td className="py-3 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080]">
                      {s.reg_number ?? "—"}
                    </td>
                    <td className="py-3 border-b border-[#DCD5C7] text-[13px] capitalize">
                      {s.gender ?? "—"}
                    </td>
                    <td className="py-3 border-b border-[#DCD5C7]">
                      <span className={`inline-block text-[11px] font-medium rounded-[3px] px-2 py-0.5 ${
                        s.is_active !== false
                          ? "bg-[#EAEFE6] text-[#5E7A5E]"
                          : "bg-[#F3E7E3] text-[#8B4A3D]"
                      }`}>
                        {s.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 border-b border-[#DCD5C7]">
                        <Link href={`/my-class/${s.id}`}>
                    <button
                      className="flex items-center gap-1 text-[11.5px] font-medium border border-[#DCD5C7] bg-white rounded-[3px] px-2.5 py-1.5"
                    >
                      <CiUser size={11} /> View
                    </button>
                    </Link>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-[13px] text-[#8A98A3]">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Subjects tab ── */}
      {tab === "subjects" && (
        <div>
          {!termId ? (
            <p className="text-[13.5px] text-[#8A98A3]">No active term set — contact the principal.</p>
          ) : subjectsLoading ? (
            <p className="text-[13.5px] text-[#5C7080]">Loading subjects…</p>
          ) : (
            <table className="w-full border-collapse max-w-[680px]">
              <thead>
                <tr>
                  {["Subject", "Code", "Level", "Teacher"].map((h) => (
                    <th key={h} className="text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id ?? s.subject_id}>
                    <td className="py-3 border-b border-[#DCD5C7] text-[13.5px]">{s.name ?? s.subject_name}</td>
                    <td className="py-3 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080]">{s.code ?? "—"}</td>
                    <td className="py-3 border-b border-[#DCD5C7] text-[13px] capitalize">{s.level ?? "—"}</td>
                    <td className="py-3 border-b border-[#DCD5C7] text-[13px]">{s.teacher_name ?? "—"}</td>
                  </tr>
                ))}
                {subjects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-[13px] text-[#8A98A3]">
                      No subjects assigned for this term yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function StatChip({ icon: Icon, value, label }) {
  return (
    <div className="text-center">
      <div className="flex items-center gap-1.5 text-[#5C7080] justify-center mb-0.5">
        <Icon size={13} />
        <span className="text-[11px] uppercase tracking-[0.06em]">{label}</span>
      </div>
      <div className="font-serif text-[22px] font-medium text-[#1C2630]">{value}</div>
    </div>
  );
}

export default function MyClassPage() {
  return (
    <ProtectedRoute allowedRoles={["form_teacher"]}>
      <MyClassContent />
    </ProtectedRoute>
  );
}