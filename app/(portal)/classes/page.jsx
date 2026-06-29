"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  LuPlus,
  LuSearch,
  LuX,
  LuCheck,
  LuLoader,
  LuBookOpen,
  LuUser,
  LuGraduationCap,
  LuTrash2,
  LuLayers,
} from "react-icons/lu";
import {
  listClasses,
  createClass,
  updateClass,
  listSubjects,
  createSubject,
  deleteSubject,
  getAssignedSubjects,
  assignSubject,
} from "../../_lib/classes";
import { listAllStaff } from "../../_lib/staff";
import { listAllAcademicSessions, listTermsForSession } from "../../_lib/school";
import { useAuth } from "../../_lib/AuthContext";
import ProtectedRoute from "../../_lib/ProtectedRoutes";

const TABS = [
  { key: "classes", label: "Classes", icon: LuLayers },
  { key: "subjects", label: "Subjects", icon: LuBookOpen },
];

function ClassesPageContent() {
  const { user } = useAuth();
  const isPrincipal = user?.role === "principal";
  const isVP = user?.role === "vice_principal";

  const [activeTab, setActiveTab] = useState("classes");
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [activeTermId, setActiveTermId] = useState(null);

  // Selection & Details States
  const [selectedClass, setSelectedClass] = useState(null);
  const [classSubjects, setClassSubjects] = useState([]);
  const [isLoadingClassDetails, setIsLoadingClassDetails] = useState(false);

  // Filters & Search
  const [classSearch, setClassSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  // Modals
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showAssignSubjectModal, setShowAssignSubjectModal] = useState(false);

  // Form States
  const [classForm, setClassForm] = useState({ name: "", arm: "", level: "JSS", form_teacher_id: "" });
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", level: "JSS" });
  const [assignForm, setAssignForm] = useState({ subject_id: "", teacher_id: "" });
  const [editingTeacherId, setEditingTeacherId] = useState("");
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);
  const [isSubmittingSubject, setIsSubmittingSubject] = useState(false);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);

  // Initial Load
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        const [classesData, subjectsData, staffData] = await Promise.all([
          listClasses(),
          listSubjects(),
          listAllStaff(),
        ]);

        console.log(subjectsData);

        setClasses(classesData || []);
        setSubjects(subjectsData || []);
        
        const unpackedStaff = staffData?.users ?? staffData ?? [];
        setStaff(unpackedStaff);

        // Fetch active term ID
        try {
          const sessions = await listAllAcademicSessions();
          const currentSession = sessions?.find((s) => s.is_current);
          if (currentSession) {
            const terms = await listTermsForSession(currentSession.id);
            const currentTerm = terms?.find((t) => t.is_current);
            if (currentTerm) {
              setActiveTermId(currentTerm.id);
            }
          }
        } catch (e) {
          console.warn("Could not load current academic term config:", e);
        }
      } catch (err) {
        toast.error(err.message || "Failed to load directory data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Fetch Class Details (Subjects)
  const fetchClassDetails = async (cls) => {
    setSelectedClass(cls);
    setEditingTeacherId(cls.form_teacher_id || "");
    setIsLoadingClassDetails(true);
    try {
      const data = await getAssignedSubjects(cls.id);
      setClassSubjects(data || []);
    } catch (err) {
      toast.error(err.message || "Could not fetch assigned subjects.");
    } finally {
      setIsLoadingClassDetails(false);
    }
  };

  // Create Class Submit
  const handleCreateClassSubmit = async (e) => {
    e.preventDefault();
    if (!classForm.name.trim() || !classForm.arm.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setIsSubmittingClass(true);
    try {
      const newCls = await createClass(
        classForm.name,
        classForm.arm,
        classForm.level,
        classForm.form_teacher_id || null
      );
      toast.success("Class created successfully.");
      setClasses((prev) => [...prev, newCls]);
      setShowClassModal(false);
      setClassForm({ name: "", arm: "", level: "JSS", form_teacher_id: "" });
    } catch (err) {
      toast.error(err.message || "Failed to create class.");
    } finally {
      setIsSubmittingClass(false);
    }
  };

  // Update Form Teacher (Principal Only)
  const handleUpdateFormTeacher = async () => {
    if (!isPrincipal) return;
    setIsSavingTeacher(true);
    try {
      await updateClass(selectedClass.id, editingTeacherId || null);
      toast.success("Form teacher updated.");
      
      // Update local state
      setClasses((prev) =>
        prev.map((c) =>
          c.id === selectedClass.id ? { ...c, form_teacher_id: editingTeacherId } : c
        )
      );
      setSelectedClass((prev) => ({ ...prev, form_teacher_id: editingTeacherId }));
    } catch (err) {
      toast.error(err.message || "Could not update form teacher.");
    } finally {
      setIsSavingTeacher(false);
    }
  };

  // Create Subject Submit
  const handleCreateSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim() || !subjectForm.code.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setIsSubmittingSubject(true);
    try {
      const newSub = await createSubject(subjectForm.name, subjectForm.code, subjectForm.level);
      toast.success("Subject created successfully.");
      setSubjects((prev) => [...prev, newSub]);
      setShowSubjectModal(false);
      setSubjectForm({ name: "", code: "", level: "JSS" });
    } catch (err) {
      toast.error(err.message || "Failed to create subject.");
    } finally {
      setIsSubmittingSubject(false);
    }
  };

  // Delete Subject (Principal Only)
  const handleDeleteSubject = async (subjectId) => {
    if (!isPrincipal) return;
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await deleteSubject(subjectId);
      toast.success("Subject deleted successfully.");
      setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    } catch (err) {
      toast.error(err.message || "Could not delete subject.");
    }
  };

  // Assign Subject to Class Submit
  const handleAssignSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.subject_id || !assignForm.teacher_id) {
      toast.error("Please select both a subject and a teacher.");
      return;
    }
    if (!activeTermId) {
      toast.error("No active academic term configured. Please configure a current term first under School Profile.");
      return;
    }
    setIsSubmittingAssignment(true);
    try {
      const res = await assignSubject(
        selectedClass.id,
        assignForm.subject_id,
        assignForm.teacher_id,
        activeTermId
      );
      toast.success("Subject assigned to class.");
      
      // Reload class subjects
      const updatedSubjects = await getAssignedSubjects(selectedClass.id);
      setClassSubjects(updatedSubjects || []);
      
      setShowAssignSubjectModal(false);
      setAssignForm({ subject_id: "", teacher_id: "" });
    } catch (err) {
      toast.error(err.message || "Could not assign subject to class.");
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  // Helpers to format staff/teacher names
  const getStaffName = (staffId) => {
    const s = staff.find((member) => member.id === staffId);
    return s ? `${s.first_name} ${s.last_name}` : "Unassigned";
  };

  // Filtered Lists
  const filteredClasses = classes.filter((c) => {
    if (levelFilter && c.level !== levelFilter) return false;
    if (classSearch) {
      const q = classSearch.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchArm = c.arm?.toLowerCase().includes(q);
      const matchTeacher = getStaffName(c.form_teacher_id).toLowerCase().includes(q);
      if (!matchName && !matchArm && !matchTeacher) return false;
    }
    return true;
  });

  const filteredSubjects = subjects.filter((s) => {
    if (
  levelFilter &&
  s.level !== levelFilter &&
  s.level !== "BOTH"
) {
  return false;
}
    if (subjectSearch) {
      const q = subjectSearch.toLowerCase();
      const matchName = s.name?.toLowerCase().includes(q);
      const matchCode = s.code?.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LuLoader className="animate-spin text-[#9C7A3C]" size={36} />
        <p className="text-[13.5px] text-[#5C7080] mt-3">Loading classes & subjects directory...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Top Header */}
      <div className="flex justify-between items-end mb-1.5">
        <div>
          <h1 className="font-serif text-[27px] font-medium text-[#1C2630]">Classes & Subjects</h1>
          <p className="text-[12.5px] text-[#5C7080] mt-1">
            Configure classes, allocate subjects, and assign form teachers
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowClassModal(true)}
            className="flex items-center gap-1.5 text-[12.5px] font-medium bg-[#1C2630] text-[#FAF8F4] rounded-[4px] px-3.5 py-2.5 hover:bg-[#2b3947]"
          >
            <LuPlus size={14} /> New class
          </button>
          <button
            onClick={() => setShowSubjectModal(true)}
            className="flex items-center gap-1.5 text-[12.5px] font-medium border border-[#DCD5C7] bg-white text-[#1C2630] rounded-[4px] px-3.5 py-2.5 hover:bg-gray-50"
          >
            <LuPlus size={14} /> New subject
          </button>
        </div>
      </div>

      <div className="border-b border-[#DCD5C7] my-5" />

      {/* Tabs Menu & Global Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex border-b border-[#DCD5C7] md:border-none">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setActiveTab(t.key);
                  setSelectedClass(null);
                }}
                className={`flex items-center gap-2 text-[13.5px] font-medium px-4 py-3 border-b-2 -mb-px transition-all ${
                  activeTab === t.key
                    ? "border-[#9C7A3C] text-[#1C2630]"
                    : "border-transparent text-[#8A98A3] hover:text-[#5C7080]"
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 border border-[#DCD5C7] rounded-[4px] px-3 py-2 bg-white flex-1 max-w-[280px]">
            <LuSearch size={14} className="text-[#8A98A3]" />
            <input
              value={activeTab === "classes" ? classSearch : subjectSearch}
              onChange={(e) => {
                if (activeTab === "classes") setClassSearch(e.target.value);
                else setSubjectSearch(e.target.value);
              }}
              placeholder={activeTab === "classes" ? "Search classes or teachers" : "Search subjects"}
              className="text-[13px] outline-none bg-transparent w-full"
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="text-[13px] border border-[#DCD5C7] rounded-[4px] px-3 py-2 bg-white outline-none"
          >
            <option value="">All levels</option>
            <option value="JSS">Junior Secondary (JSS)</option>
            <option value="SSS">Senior Secondary (SSS)</option>
          </select>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Directory Listing (Left 2 Columns) */}
        <div className="lg:col-span-2 bg-white border border-[#DCD5C7] rounded-[6px] p-5">
          {activeTab === "classes" ? (
            <div>
              <div className="mb-4">
                <h3 className="font-serif text-[16px] font-medium text-[#1C2630]">Available Classes</h3>
                <p className="text-[11.5px] text-[#5C7080]">Select a class to manage its form teacher and subjects</p>
              </div>

              {filteredClasses.length === 0 ? (
                <p className="text-[13px] text-[#8A98A3] text-center py-8">No classes found.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["Class Name", "Arm", "Level", "Form Teacher", ""].map((h) => (
                        <th key={h} className="text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClasses.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => fetchClassDetails(c)}
                        className={`cursor-pointer hover:bg-[#FAF8F4]/80 transition-colors ${
                          selectedClass?.id === c.id ? "bg-[#FAEEDA]/50" : ""
                        }`}
                      >
                        <td className="py-3 border-b border-[#DCD5C7] text-[13.5px] font-medium text-[#1C2630]">
                          {c.name}
                        </td>
                        <td className="py-3 border-b border-[#DCD5C7] text-[13px] font-mono text-[#5C7080]">
                          {c.arm}
                        </td>
                        <td className="py-3 border-b border-[#DCD5C7] text-[13px]">
                          <span className="inline-block text-[11px] font-medium bg-gray-100 text-[#5C7080] rounded-[3px] px-1.5 py-0.5">
                            {c.level}
                          </span>
                        </td>
                        <td className="py-3 border-b border-[#DCD5C7] text-[13px] text-[#5C7080]">
                          {getStaffName(c.form_teacher_id)}
                        </td>
                        <td className="py-3 border-b border-[#DCD5C7] text-right text-[12px] font-medium text-[#9C7A3C]">
                          Manage &rarr;
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="font-serif text-[16px] font-medium text-[#1C2630]">Subjects Catalog</h3>
                <p className="text-[11.5px] text-[#5C7080]">School-wide subjects configuration</p>
              </div>

              {filteredSubjects.length === 0 ? (
                <p className="text-[13px] text-[#8A98A3] text-center py-8">No subjects found.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["Subject Name", "Code", "Level", ""].map((h) => (
                        <th key={h} className="text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubjects.map((s) => (
                      <tr key={s.id} className="hover:bg-[#FAF8F4]/30 transition-colors">
                        <td className="py-3 border-b border-[#DCD5C7] text-[13.5px] font-medium text-[#1C2630]">
                          {s.name}
                        </td>
                        <td className="py-3 border-b border-[#DCD5C7] text-[13px] font-mono text-[#5C7080]">
                          {s.code}
                        </td>
                        <td className="py-3 border-b border-[#DCD5C7] text-[13px]">
                          <span className="inline-block text-[11px] font-medium bg-gray-100 text-[#5C7080] rounded-[3px] px-1.5 py-0.5">
                            {s.level}
                          </span>
                        </td>
                        <td className="py-3 border-b border-[#DCD5C7] text-right">
                          {isPrincipal && (
                            <button
                              onClick={() => handleDeleteSubject(s.id)}
                              className="text-[#8B4A3D] hover:text-[#723B30] p-1.5 rounded hover:bg-[#F3E7E3]"
                              title="Delete Subject"
                            >
                              <LuTrash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Detailed Inspector Panel (Right 1 Column) */}
        <div className="bg-white border border-[#DCD5C7] rounded-[6px] p-5">
          {activeTab === "classes" && selectedClass ? (
            <div>
              <div className="flex justify-between items-start border-b border-[#DCD5C7] pb-3 mb-4">
                <div>
                  <h3 className="font-serif text-[17px] font-medium text-[#1C2630]">
                    {selectedClass.name} {selectedClass.arm}
                  </h3>
                  <span className="text-[11.5px] bg-[#EAEFE6] text-[#5E7A5E] font-medium rounded px-1.5 py-0.5 mt-1 inline-block">
                    Level: {selectedClass.level}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="text-[#8A98A3] hover:text-[#5C7080] p-1"
                >
                  <LuX size={16} />
                </button>
              </div>

              {/* Form Teacher Control */}
              <div className="mb-6">
                <label className="block text-[11.5px] uppercase tracking-wider text-[#8A98A3] mb-1.5 font-medium">
                  Form Teacher
                </label>
                {isPrincipal ? (
                  <div className="flex gap-2">
                    <select
                      value={editingTeacherId}
                      onChange={(e) => setEditingTeacherId(e.target.value)}
                      className="text-[13px] border border-[#DCD5C7] rounded-[4px] px-3 py-2 bg-white outline-none flex-1 focus:border-[#9C7A3C]"
                    >
                      <option value="">Unassigned</option>
                      {staff.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.first_name} {member.last_name} ({member.role?.replace("_", " ")})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleUpdateFormTeacher}
                      disabled={isSavingTeacher || editingTeacherId === (selectedClass.form_teacher_id || "")}
                      className="bg-[#1C2630] text-[#FAF8F4] rounded-[4px] px-3.5 py-2 text-[12px] font-medium disabled:opacity-50 hover:bg-[#2b3947]"
                    >
                      {isSavingTeacher ? "Saving..." : "Save"}
                    </button>
                  </div>
                ) : (
                  <div className="text-[13.5px] font-medium text-[#1C2630] flex items-center gap-1.5 bg-[#FAF8F4] rounded p-2.5 border border-[#E5E0D5]">
                    <LuUser className="text-[#8A98A3]" size={14} />
                    {getStaffName(selectedClass.form_teacher_id)}
                    <span className="text-[10.5px] text-[#8A98A3] font-normal block ml-auto italic">
                      (Read-only for VP)
                    </span>
                  </div>
                )}
              </div>

              {/* Assigned Subjects */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-[11.5px] uppercase tracking-wider text-[#8A98A3] font-medium">
                    Allocated Subjects
                  </label>
                  <button
                    onClick={() => setShowAssignSubjectModal(true)}
                    className="text-[11.5px] text-[#9C7A3C] hover:text-[#7d612f] font-medium flex items-center gap-1"
                  >
                    <LuPlus size={12} /> Assign subject
                  </button>
                </div>

                {isLoadingClassDetails ? (
                  <div className="flex justify-center py-6">
                    <LuLoader className="animate-spin text-[#8A98A3]" size={20} />
                  </div>
                ) : classSubjects.length === 0 ? (
                  <p className="text-[12.5px] text-[#8A98A3] italic bg-[#FAF8F4] p-3 text-center rounded border border-[#E5E0D5]">
                    No subjects assigned to this class yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {classSubjects.map((cs) => (
                      <div
                        key={cs.id}
                        className="bg-[#FAF8F4] border border-[#E5E0D5] rounded p-2.5 text-[13px] flex flex-col gap-1"
                      >
                        <div className="flex justify-between items-baseline">
                          <span className="font-semibold text-[#1C2630]">
                            {cs.subject?.name || "Unknown Subject"}
                          </span>
                          <span className="font-mono text-[11px] text-[#8A98A3]">
                            {cs.subject?.code}
                          </span>
                        </div>
                        <div className="text-[11.5px] text-[#5C7080] flex items-center gap-1">
                          <LuGraduationCap size={12} />
                          Teacher: {cs.teacher ? `${cs.teacher.first_name} ${cs.teacher.last_name}` : "None"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#8A98A3] flex flex-col items-center justify-center h-full min-h-[220px]">
              <LuBookOpen size={30} className="mb-2.5 opacity-60" />
              <p className="text-[13px] font-medium">No Class Selected</p>
              <p className="text-[11.5px] mt-1 max-w-[200px]">
                Click on any class in the directory table to inspect subjects and assign teachers.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Create Class */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100] px-6">
          <div className="bg-white rounded-[6px] w-full max-w-[420px] px-7 py-7 relative">
            <button
              onClick={() => setShowClassModal(false)}
              className="absolute top-5 right-5 text-[#8A98A3]"
            >
              <LuX size={18} />
            </button>

            <h2 className="font-serif text-[18px] font-medium mb-5">Create new class</h2>

            <form onSubmit={handleCreateClassSubmit}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[12px] text-[#5C7080] mb-1.5">Class Name</label>
                  <input
                    type="text"
                    placeholder="e.g. JSS 1, SSS 3"
                    value={classForm.name}
                    onChange={(e) => setClassForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2 outline-none focus:border-[#9C7A3C]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[#5C7080] mb-1.5">Arm</label>
                  <input
                    type="text"
                    placeholder="e.g. A, B, Gold"
                    value={classForm.arm}
                    onChange={(e) => setClassForm((f) => ({ ...f, arm: e.target.value }))}
                    required
                    className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2 outline-none focus:border-[#9C7A3C]"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[12px] text-[#5C7080] mb-1.5">Level Group</label>
                <select
                  value={classForm.level}
                  onChange={(e) => setClassForm((f) => ({ ...f, level: e.target.value }))}
                  className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 bg-white outline-none focus:border-[#9C7A3C]"
                >
                  <option value="JSS">Junior Secondary (JSS)</option>
                  <option value="SSS">Senior Secondary (SSS)</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-[12px] text-[#5C7080] mb-1.5">
                  Initial Form Teacher <span className="text-[#8A98A3]">(Optional)</span>
                </label>
                <select
                  value={classForm.form_teacher_id}
                  onChange={(e) => setClassForm((f) => ({ ...f, form_teacher_id: e.target.value }))}
                  className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 bg-white outline-none focus:border-[#9C7A3C]"
                >
                  <option value="">Unassigned</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name} ({member.role?.replace("_", " ")})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingClass}
                className="w-full bg-[#1C2630] text-[#FAF8F4] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60 hover:bg-[#2b3947]"
              >
                {isSubmittingClass ? "Creating…" : "Create class"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Subject */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100] px-6">
          <div className="bg-white rounded-[6px] w-full max-w-[420px] px-7 py-7 relative">
            <button
              onClick={() => setShowSubjectModal(false)}
              className="absolute top-5 right-5 text-[#8A98A3]"
            >
              <LuX size={18} />
            </button>

            <h2 className="font-serif text-[18px] font-medium mb-5">Create new subject</h2>

            <form onSubmit={handleCreateSubjectSubmit}>
              <div className="mb-4">
                <label className="block text-[12px] text-[#5C7080] mb-1.5">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics, English Literature"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2 outline-none focus:border-[#9C7A3C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="block text-[12px] text-[#5C7080] mb-1.5">Subject Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MTH101"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm((f) => ({ ...f, code: e.target.value }))}
                    required
                    className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2 outline-none focus:border-[#9C7A3C]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[#5C7080] mb-1.5">Level Group</label>
                  <select
                    value={subjectForm.level}
                    onChange={(e) => setSubjectForm((f) => ({ ...f, level: e.target.value }))}
                    className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 bg-white outline-none focus:border-[#9C7A3C]"
                  >
                    <option value="JSS">JSS</option>
                    <option value="SSS">SSS</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingSubject}
                className="w-full bg-[#1C2630] text-[#FAF8F4] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60 hover:bg-[#2b3947]"
              >
                {isSubmittingSubject ? "Creating…" : "Create subject"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign Subject */}
      {showAssignSubjectModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100] px-6">
          <div className="bg-white rounded-[6px] w-full max-w-[420px] px-7 py-7 relative">
            <button
              onClick={() => setShowAssignSubjectModal(false)}
              className="absolute top-5 right-5 text-[#8A98A3]"
            >
              <LuX size={18} />
            </button>

            <h2 className="font-serif text-[18px] font-medium mb-1">Assign subject to class</h2>
            <p className="text-[12.5px] text-[#5C7080] mb-5">
              Target class: <span className="font-semibold text-[#1C2630]">{selectedClass.name} {selectedClass.arm}</span>
            </p>

            <form onSubmit={handleAssignSubjectSubmit}>
              <div className="mb-4">
                <label className="block text-[12px] text-[#5C7080] mb-1.5">Subject</label>
                <select
                  value={assignForm.subject_id}
                  onChange={(e) => setAssignForm((f) => ({ ...f, subject_id: e.target.value }))}
                  required
                  className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 bg-white outline-none focus:border-[#9C7A3C]"
                >
                  <option value="">Select a subject</option>
                  {subjects
  .filter((s) =>
    ["BOTH", selectedClass.level].includes(s.level)
  )
  .map((s) => (
    <option key={s.id} value={s.id}>
      {s.name} ({s.code})
    </option>
  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-[12px] text-[#5C7080] mb-1.5">Assign Teacher</label>
                <select
                  value={assignForm.teacher_id}
                  onChange={(e) => setAssignForm((f) => ({ ...f, teacher_id: e.target.value }))}
                  required
                  className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 bg-white outline-none focus:border-[#9C7A3C]"
                >
                  <option value="">Select teacher</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name} ({member.role?.replace("_", " ")})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAssignment}
                className="w-full bg-[#1C2630] text-[#FAF8F4] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60 hover:bg-[#2b3947]"
              >
                {isSubmittingAssignment ? "Allocating…" : "Allocate subject"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClassesPage() {
  return (
    <ProtectedRoute allowedRoles={["principal", "vice_principal"]}>
      <ClassesPageContent />
    </ProtectedRoute>
  );
}
