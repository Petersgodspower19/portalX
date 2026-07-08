
'use client'
import { useAuth } from '@/app/_lib/AuthContext'
import ProtectedRoute from '@/app/_lib/ProtectedRoutes'

import React, { useState } from 'react'

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[12px] text-[#8A98A3] mb-1">{label}</p>
      <p className="text-[14px] font-medium text-[#1C2630]">
        {value || "—"}
      </p>
    </div>
  );
}

function StudentContent() {
  const {user} = useAuth()
  const [tab, setTab] = useState("profile");
  const [drilldown, setDrilldown] = useState(null);
  console.log(user)
  return (
    <section >
      <div className="flex justify-between items-end mb-1.5">
        <div>
          <h1 className="font-serif text-[27px] font-medium">Student Dashboard</h1>
          <p className="text-[12.5px] text-[#5C7080] mt-1">{}</p>
        </div>
        <div className="font-mono flex items-center gap-3 text-[12px] text-[#5C7080] border border-[#DCD5C7] rounded-[3px] px-3 py-1.5 bg-white uppercase tracking-wide">
        <div className="bg-[#9C7A3C] h-8 w-8 rounded-full flex items-center justify-center text-white text-[12px] font-semibold uppercase">
  {`${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`}
</div>
             <span>
                {user?.first_name} {user?.last_name}
             </span>
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
      className={`text-[13px] font-medium px-3.5 py-2.5 border-b-2 -mb-px transition-colors ${
        tab === t.key
          ? "border-[#9C7A3C] text-[#1C2630]"
          : "border-transparent text-[#8A98A3] hover:text-[#1C2630]"
      }`}
    >
      {t.label}
    </button>
  ))}
</div>

      {tab === "profile" && <ProfileTab user={user} />}

{tab === "results" && <ResultsTab />}

{tab === "fees" && <FeesTab />}
    
    </section>
  )
}


function ProfileTab({ user }) {
  return (
    <div className="bg-white border border-[#DCD5C7] rounded-[6px] p-6">
      <div className="grid grid-cols-2 gap-6">
        <Info label="First name" value={user?.first_name} />
        <Info label="Last name" value={user?.last_name} />
        <Info label="Phone" value={user?.phone || "—"} />
        <Info label="Email" value={user?.email || "—"} />
        <Info label="Role" value={user?.role} />
        <Info label="Student ID" value={user?.id} />
      </div>
    </div>
  );
}


function ResultsTab() {
  return (
    <div className="bg-white border border-[#DCD5C7] rounded-[6px] p-12 text-center">
      <h3 className="font-serif text-xl mb-2">Results</h3>
      <p className="text-[13px] text-[#5C7080]">
        Select a term to view your results.
      </p>
    </div>
  );
}


function FeesTab() {
  return (
    <div className="bg-white border border-[#DCD5C7] rounded-[6px] p-12 text-center">
      <h3 className="font-serif text-xl mb-2">Fees</h3>
      <p className="text-[13px] text-[#5C7080]">
        Select a term to view your fees.
      </p>
    </div>
  );
}


export default function StudentProfile() {
    return (
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentContent />
    </ProtectedRoute>
    )
}
