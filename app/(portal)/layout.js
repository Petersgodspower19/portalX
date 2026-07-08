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
      { title: "Results", route: "/results", icon: LuClipboardList, roles: ["principal", "vice_principal", "form_teacher"] },
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
    <aside className="fixed left-0 top-0 h-full w-[248px] bg-[#1C2630] text-[#FAF8F4] flex flex-col py-7 px-6 z-50">
      <div className="mb-9">
        <div className="font-serif text-[21px] font-semibold tracking-tight">PortalX</div>
        <div className="text-[11px] uppercase tracking-[0.08em] text-[#C9B68A] mt-1">
          Tarepet Montessori
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-1">
            <div className="text-[10px] uppercase tracking-[0.1em] text-[#6E7A85] mt-5 mb-2.5">
              {group.label}
            </div>
            {group.links.map((link) => {
              const isActive = pathname === link.route || pathname.startsWith(link.route + "/");
              const Icon = link.icon;
              return (
                <Link
                  key={link.route}
                  href={link.route}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-[13.5px] border-l-2 ${
                    isActive
                      ? "bg-[#9C7A3C]/15 text-[#F2E9D8] border-[#9C7A3C]"
                      : "text-[#C7CDD3] border-transparent hover:bg-white/5"
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

      <div className="flex items-center gap-2.5 pt-5 border-t border-[#2C3744]">
        <div className="w-[34px] h-[34px] rounded-full bg-[#9C7A3C] text-[#1C2630] flex items-center justify-center font-serif font-semibold text-sm shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] text-[#EDEAE3] truncate">
            {user?.first_name} {user?.last_name}
          </div>
          <div className="text-[11px] uppercase tracking-[0.05em] text-[#8C97A1]">
            {user?.role?.replace("_", " ")}
          </div>
        </div>
        <LuChevronDown size={18} className="ml-auto shrink-0 text-[#8C97A1] cursor-pointer" />
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#1C2630]">
      <Sidenav />
      <main className="ml-[248px] px-11 py-8 max-w-[1180px]">{children}</main>
    </div>
  );
}
