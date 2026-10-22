"use client";
import ProtectedRoute from "@/app/_lib/ProtectedRoutes";
import StudentRecord from "@/app/_components/student-record/StudentRecord";

export default function StudentDetailPage() {
  return <ProtectedRoute allowedRoles={["principal", "vice_principal"]}><StudentRecord /></ProtectedRoute>;
}
