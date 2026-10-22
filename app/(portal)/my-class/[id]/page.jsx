"use client";
import ProtectedRoute from "@/app/_lib/ProtectedRoutes";
import StudentRecord from "@/app/_components/student-record/StudentRecord";

export default function ClassStudentDetailPage() {
  return <ProtectedRoute allowedRoles={["principal", "vice_principal", "form_teacher"]}><StudentRecord fromClass /></ProtectedRoute>;
}
