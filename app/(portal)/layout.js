"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuLayoutDashboard,
  LuUsers,
  LuGraduationCap,
  LuClipboardList,
  LuWallet,
  LuUserCog,
  LuScrollText,
  LuBuilding2,
  LuChevronDown,
} from "react-icons/lu";
import { PiStudentBold } from "react-icons/pi";
import { useAuth } from "../_lib/AuthContext";

// Real PortalX routes, grouped the way they'll actually be gated by role later.
// `roles` is kept on each link for when filtering logic gets wired in — not applied yet.
const navGroups = [
  {
    label: "Overview",
    links: [
      { title: "Dashboard", route: "/dashboard", icon: LuLayoutDashboard, roles: ["principal", "vice_principal"] },
      { title: "Student Profile", route: "/student-profile", icon: PiStudentBold, roles: ["student"] },
      { title: "Audit log", route: "/audit", icon: LuScrollText, roles: ["principal", "vice_principal"] },
    ],
  },
  {
    label: "Academics",
    links: [
      { title: "Classes & subjects", route: "/classes", icon: LuGraduationCap, roles: ["principal", "vice_principal"] },
      { title: "Results", route: "/results", icon: LuClipboardList, roles: ["principal",  "form_teacher"] },
      { title: "Students", route: "/students", icon: LuUsers, roles: ["principal", "vice_principal"] },
      { title: "My Class", route: "/my-class", icon: LuGraduationCap, roles: ["form_teacher"] },
    ],
  },
  {
    label: "Administration",
    links: [
      { title: "Fees", route: "/fees", icon: LuWallet, roles: ["principal", "vice_principal", "bursar"] },
      { title: "Staff", route: "/staff", icon: LuUserCog, roles: ["principal"] },
      { title: "School profile", route: "/school-profile", icon: LuBuilding2, roles: ["principal"] },
    ],
  },
];

function Sidenav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <aside className="portal-sidebar fixed left-0 top-0 h-full w-[248px] bg-[#172B4D] text-[#F4F7FB] flex flex-col py-7 px-6 z-50">
      <div className="portal-brand mb-9">
        <div className="brand-symbol" aria-hidden="true"><LuGraduationCap size={23} /></div>
        <div className="font-serif text-[21px] font-semibold tracking-tight">PortalX</div>
        <div className="text-[11px] uppercase tracking-[0.08em] text-[#93B4F4] mt-1">
          Tarepet Montessori
        </div>
      </div>

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-1">
            <div className="text-[10px] uppercase tracking-[0.1em] text-[#8396B3] mt-5 mb-2.5">
              {group.label}
            </div>
            {group.links.map((link) => {
              const isActive = pathname === link.route || pathname.startsWith(link.route + "/");
              const Icon = link.icon;
              return (
                <Link
                  key={link.route}
                  href={link.route}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-[13.5px] border-l-2 ${
                    isActive
                      ? "bg-[#2563EB]/15 text-[#EFF5FF] border-[#2563EB]"
                      : "text-[#B5C3D8] border-transparent hover:bg-white/5"
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  {link.title}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 pt-5 border-t border-[#2B3E5D]">
        <div className="w-[34px] h-[34px] rounded-full bg-[#2563EB] text-[#172B4D] flex items-center justify-center font-serif font-semibold text-sm shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] text-[#F0F4FB] truncate">
            {user?.first_name} {user?.last_name}
          </div>
          <div className="text-[11px] uppercase tracking-[0.05em] text-[#9AAEC9]">
            {user?.role?.replace("_", " ")}
          </div>
        </div>
        <LuChevronDown size={18} className="ml-auto shrink-0 text-[#9AAEC9] cursor-pointer" />
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const activeLink = navGroups.flatMap((group) => group.links).find((link) => pathname === link.route || pathname.startsWith(link.route + "/"));
  return (
    <div className="portal-shell min-h-screen bg-[#F4F7FB] text-[#172B4D]">
      <Sidenav />
      <div className="portal-workspace">
        <header className="workspace-header">
          <div className="workspace-breadcrumb">Workspace <span aria-hidden="true">/</span> <strong>{pathname === "/change-password" ? "Account settings" : activeLink?.title ?? "Portal"}</strong></div>
          <span className="workspace-school"><LuBuilding2 size={15} /> Tarepet Montessori</span>
        </header>
        <main className="portal-main">{children}</main>
        <footer className="workspace-footer"><span>PortalX</span> School administration, thoughtfully organised.</footer>
      </div>
    </div>
  );
}
