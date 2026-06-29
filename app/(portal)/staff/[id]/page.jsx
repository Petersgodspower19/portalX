"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  LuArrowLeft,
  LuMail,
  LuPhone,
  LuShield,
  LuCalendar,
  LuPencil,
  LuCheck,
  LuX,
  LuUserX,
  LuUserCheck,
  LuLoader,
} from "react-icons/lu";
import {
  getStaff,
  updateStaffDetails,
  deactivateStaff,
  reactivateStaff,
} from "../../../_lib/staff";
import ProtectedRoute from "../../../_lib/ProtectedRoutes";

function StaffProfileContent() {
  const { id } = useParams();
  const router = useRouter();

  const [staff, setStaff] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);

  const fetchStaffDetails = async () => {
    setIsLoading(true);
    try {
      const data = await getStaff(id);
      // Unpack nested response safely
      const unpacked = data?.user ?? data?.data ?? data;
      if (unpacked) {
        setStaff(unpacked);
        setEditForm({
          first_name: unpacked.first_name || "",
          last_name: unpacked.last_name || "",
          phone: unpacked.phone || "",
        });
      } else {
        throw new Error("Staff member not found.");
      }
    } catch (err) {
      toast.error(err.message || "Could not retrieve staff details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStaffDetails();
    }
  }, [id]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Revert changes
      setEditForm({
        first_name: staff?.first_name || "",
        last_name: staff?.last_name || "",
        phone: staff?.phone || "",
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field) => (e) => {
    setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    if (!editForm.first_name.trim() || !editForm.last_name.trim() || !editForm.phone.trim()) {
      toast.error("Please fill in all details.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await updateStaffDetails(
        id,
        editForm.first_name,
        editForm.last_name,
        editForm.phone
      );
      toast.success("Profile updated successfully.");
      const updatedUser = res?.user ?? res?.data ?? res ?? {};
      setStaff((prev) => ({
        ...prev,
        ...updatedUser,
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone: editForm.phone,
      }));
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || "Failed to update details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateStaff(id);
      toast.success("Staff member reactivated.");
      setStaff((prev) => ({ ...prev, is_active: true }));
    } catch (err) {
      toast.error(err.message || "Could not reactivate staff.");
    }
  };

  const handleDeactivateSubmit = async (e) => {
    e.preventDefault();
    if (!deactivateReason.trim()) {
      toast.error("Please enter a reason for deactivation.");
      return;
    }
    setIsDeactivating(true);
    try {
      await deactivateStaff(id, deactivateReason);
      toast.success("Staff member deactivated.");
      setStaff((prev) => ({ ...prev, is_active: false }));
      setShowDeactivateModal(false);
      setDeactivateReason("");
    } catch (err) {
      toast.error(err.message || "Could not deactivate staff.");
    } finally {
      setIsDeactivating(false);
    }
  };

  // Get initials for profile avatar
  const getInitials = () => {
    if (!staff) return "?";
    const first = staff.first_name?.charAt(0) || "";
    const last = staff.last_name?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LuLoader className="animate-spin text-[#9C7A3C]" size={36} />
        <p className="text-[13.5px] text-[#5C7080] mt-3">Fetching staff details...</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-12">
        <h2 className="font-serif text-[20px] font-medium text-[#1C2630] mb-2">Staff Member Not Found</h2>
        <p className="text-[13.5px] text-[#5C7080] mb-6">The requested staff record does not exist or you lack permission to view it.</p>
        <Link
          href="/staff"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium bg-[#1C2630] text-[#FAF8F4] rounded-[4px] px-4 py-2.5"
        >
          <LuArrowLeft size={14} /> Back to staff directory
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/staff"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#5C7080] hover:text-[#1C2630] transition-colors"
        >
          <LuArrowLeft size={14} /> Back to staff
        </Link>
      </div>

      {/* Main Profile Card Header */}
      <div className="bg-white border border-[#DCD5C7] rounded-[6px] p-6 mb-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
          {/* Visual Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#9C7A3C] to-[#C9B68A] flex items-center justify-center text-white text-[22px] font-semibold tracking-wider font-serif shadow-sm">
            {getInitials()}
          </div>
          <div>
            <h1 className="font-serif text-[24px] font-medium text-[#1C2630]">
              {staff.first_name} {staff.last_name}
            </h1>
            <div className="flex flex-wrap gap-2 items-center mt-1.5">
              <span className="text-[12px] bg-gray-100 text-[#5C7080] rounded-[3px] px-2 py-0.5 capitalize font-medium">
                {staff.role?.replace("_", " ")}
              </span>
              <span
                className={`text-[11px] font-medium rounded-[3px] px-2 py-0.5 ${
                  staff.is_active ? "bg-[#EAEFE6] text-[#5E7A5E]" : "bg-[#F3E7E3] text-[#8B4A3D]"
                }`}
              >
                {staff.is_active ? "Active Account" : "Inactive / Deactivated"}
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right Quick Actions */}
        <div className="flex gap-2.5">
          {!isEditing && (
            <button
              onClick={handleEditToggle}
              className="flex items-center gap-1.5 text-[12.5px] font-medium border border-[#DCD5C7] bg-white text-[#1C2630] hover:bg-gray-50 rounded-[4px] px-4 py-2"
            >
              <LuPencil size={14} /> Edit details
            </button>
          )}

          {staff.is_active ? (
            <button
              onClick={() => setShowDeactivateModal(true)}
              className="flex items-center gap-1.5 text-[12.5px] font-medium border border-[#8B4A3D]/20 bg-[#F3E7E3] text-[#8B4A3D] hover:bg-[#ebdcd8] rounded-[4px] px-4 py-2"
            >
              <LuUserX size={14} /> Deactivate
            </button>
          ) : (
            <button
              onClick={handleReactivate}
              className="flex items-center gap-1.5 text-[12.5px] font-medium bg-[#1C2630] text-[#FAF8F4] hover:bg-[#2b3947] rounded-[4px] px-4 py-2"
            >
              <LuUserCheck size={14} /> Reactivate account
            </button>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Details (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#DCD5C7] rounded-[6px] p-6">
            <h2 className="font-serif text-[17px] font-medium text-[#1C2630] mb-5">
              Personal & System Profile
            </h2>

            {isEditing ? (
              <form onSubmit={handleUpdateDetails} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-[#5C7080] mb-1.5 font-medium">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={handleInputChange("first_name")}
                      required
                      className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#9C7A3C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#5C7080] mb-1.5 font-medium">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={handleInputChange("last_name")}
                      required
                      className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#9C7A3C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] text-[#5C7080] mb-1.5 font-medium">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={handleInputChange("phone")}
                    required
                    className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#9C7A3C]"
                  />
                </div>

                {/* Uneditable system items inside edit mode */}
                <div className="pt-3 opacity-60 pointer-events-none">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] text-[#5C7080] mb-1">Role (Cannot edit here)</label>
                      <input
                        type="text"
                        disabled
                        value={staff.role?.replace("_", " ") || ""}
                        className="w-full text-[13.5px] bg-[#FAF8F4] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 capitalize"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] text-[#5C7080] mb-1 font-medium">Email (Unchangeable)</label>
                      <input
                        type="email"
                        disabled
                        value={staff.email || ""}
                        className="w-full text-[13.5px] bg-[#FAF8F4] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#DCD5C7] mt-6">
                  <button
                    type="button"
                    onClick={handleEditToggle}
                    className="flex items-center gap-1.5 text-[13px] font-medium border border-[#DCD5C7] text-[#5C7080] hover:bg-gray-50 rounded-[4px] px-4 py-2"
                  >
                    <LuX size={14} /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 text-[13px] font-medium bg-[#1C2630] text-[#FAF8F4] hover:bg-[#2b3947] rounded-[4px] px-4 py-2 disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <LuLoader className="animate-spin" size={14} /> Saving...
                      </>
                    ) : (
                      <>
                        <LuCheck size={14} /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-[11.5px] uppercase tracking-wider text-[#8A98A3] block mb-1">
                      First Name
                    </span>
                    <span className="text-[14.5px] text-[#1C2630] font-medium">
                      {staff.first_name || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11.5px] uppercase tracking-wider text-[#8A98A3] block mb-1">
                      Last Name
                    </span>
                    <span className="text-[14.5px] text-[#1C2630] font-medium">
                      {staff.last_name || "—"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-[#E5E0D5]">
                  <div>
                    <span className="text-[11.5px] uppercase tracking-wider text-[#8A98A3] block mb-1">
                      Email Address
                    </span>
                    <span className="text-[14px] text-[#1C2630] font-mono flex items-center gap-1.5">
                      <LuMail className="text-[#8A98A3]" size={14} />
                      {staff.email || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11.5px] uppercase tracking-wider text-[#8A98A3] block mb-1">
                      Phone Number
                    </span>
                    <span className="text-[14px] text-[#1C2630] font-mono flex items-center gap-1.5">
                      <LuPhone className="text-[#8A98A3]" size={14} />
                      {staff.phone || "—"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-[#E5E0D5]">
                  <div>
                    <span className="text-[11.5px] uppercase tracking-wider text-[#8A98A3] block mb-1">
                      Assigned Role
                    </span>
                    <span className="text-[14px] text-[#1C2630] flex items-center gap-1.5 capitalize font-medium">
                      <LuShield className="text-[#8A98A3]" size={14} />
                      {staff.role?.replace("_", " ") || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11.5px] uppercase tracking-wider text-[#8A98A3] block mb-1">
                      Account Registered
                    </span>
                    <span className="text-[14px] text-[#1C2630] flex items-center gap-1.5">
                      <LuCalendar className="text-[#8A98A3]" size={14} />
                      {staff.created_at
                        ? new Date(staff.created_at).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info (Right 1 Column) */}
        <div className="space-y-6">
          <div className="bg-[#FAF8F4] border border-[#DCD5C7] rounded-[6px] p-6">
            <h3 className="font-serif text-[16px] font-medium text-[#1C2630] mb-4">
              System Metadata
            </h3>
            <div className="space-y-4 text-[12.5px] text-[#5C7080]">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#8A98A3] block mb-0.5">
                  Unique User ID
                </span>
                <span className="font-mono text-xs select-all text-[#1C2630]">
                  {staff.id}
                </span>
              </div>
              <div className="pt-3 border-t border-[#E5E0D5]">
                <span className="text-[10px] uppercase tracking-wider text-[#8A98A3] block mb-0.5">
                  Status History
                </span>
                <span className="font-medium">
                  {staff.is_active ? (
                    <span className="text-[#5E7A5E]">Active in Database</span>
                  ) : (
                    <span className="text-[#8B4A3D]">Deactivated Account</span>
                  )}
                </span>
              </div>
              {staff.deactivated_reason && (
                <div className="pt-3 border-t border-[#E5E0D5]">
                  <span className="text-[10px] uppercase tracking-wider text-[#8A98A3] block mb-0.5">
                    Deactivation Reason
                  </span>
                  <p className="bg-[#F3E7E3] text-[#8B4A3D] rounded p-2 text-xs italic">
                    "{staff.deactivated_reason}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100] px-6">
          <div className="bg-white rounded-[6px] w-full max-w-[420px] px-7 py-7 relative">
            <button
              onClick={() => {
                setShowDeactivateModal(false);
                setDeactivateReason("");
              }}
              className="absolute top-5 right-5 text-[#8A98A3]"
            >
              <LuX size={18} />
            </button>

            <h2 className="font-serif text-[18px] font-medium mb-2">Deactivate staff member</h2>
            <p className="text-[13px] text-[#5C7080] mb-5">
              Are you sure you want to deactivate{" "}
              <span className="font-medium text-[#1C2630]">
                {staff.first_name} {staff.last_name}
              </span>
              ? They will no longer be able to log in to the portal.
            </p>

            <form onSubmit={handleDeactivateSubmit}>
              <div className="mb-5">
                <label className="block text-[12px] text-[#5C7080] mb-1.5">
                  Reason for deactivation
                </label>
                <textarea
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  placeholder="e.g. Resigned, End of contract, Suspended"
                  required
                  rows={3}
                  className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#9C7A3C] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setDeactivateReason("");
                  }}
                  className="flex-1 text-[13.5px] font-medium border border-[#DCD5C7] text-[#5C7080] rounded-[4px] py-2.5 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeactivating}
                  className="flex-1 bg-[#8B4A3D] text-[#FAF8F4] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60 hover:bg-[#723B30] transition-colors flex items-center justify-center gap-1.5"
                >
                  {isDeactivating ? (
                    <>
                      <LuLoader className="animate-spin" size={14} /> Deactivating…
                    </>
                  ) : (
                    "Deactivate"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["principal", "vice_principal"]}>
      <StaffProfileContent />
    </ProtectedRoute>
  );
}
