"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { LuPlus, LuPencil, LuX, LuCheck, LuZap } from "react-icons/lu";
import {
  createFeeType, updateFeeType,
  createInvoices, markInvoiceAsPaid, markInvoiceAsUnPaid,
  grantFeeOverride, removeFeeOverride,
} from "../../_lib/fees";
import { useFeeTypes, useInvoices, useGetTerm, useAuth } from "../../_lib/hooks";
import ProtectedRoute from "../../_lib/ProtectedRoutes";
import { useAuth as useAuthCtx } from "../../_lib/AuthContext";

const TABS = [
  { key: "invoices", label: "Invoices" },
  { key: "fee-types", label: "Fee types" },
];

const STATUS_OPTIONS = ["", "paid", "unpaid", "overridden"];

function FeesContent() {
  const { user } = useAuthCtx();
  const isPrincipal = user?.role === "principal";
  const [tab, setTab] = useState("invoices");

  return (
    <div>
      <div className="mb-1.5">
        <h1 className="font-serif text-[27px] font-medium">Fees</h1>
        <p className="text-[12.5px] text-[#5C7080] mt-1">Invoice management and fee configuration</p>
      </div>

      <div className="border-b border-[#DCD5C7] mt-5 mb-6 flex gap-1">
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

      {tab === "invoices" && <InvoicesTab isPrincipal={isPrincipal} />}
      {tab === "fee-types" && <FeeTypesTab isPrincipal={isPrincipal} />}
    </div>
  );
}

/* ─── Invoices tab ──────────────────────────────────────────────────────── */

function InvoicesTab({ isPrincipal }) {
  const queryClient = useQueryClient();
  const { data: term } = useGetTerm();
  const termId = term?.id;

  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [payModal, setPayModal] = useState(null);     // invoice object
  const [unpayModal, setUnpayModal] = useState(null); // invoice object
  const [overrideModal, setOverrideModal] = useState(null); // student object

  const { data: invoices = [], isLoading } = useInvoices({
    term_id: termId,
    class_id: classId || undefined,
    status: status || undefined,
  });

  const handleMarkPaid = async (invoiceId, note) => {
    try {
      await markInvoiceAsPaid(invoiceId, note);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice marked as paid.");
      setPayModal(null);
    } catch (err) {
      toast.error(err.message || "Could not mark as paid.");
    }
  };

  const handleMarkUnpaid = async (invoiceId, reason) => {
    try {
      await markInvoiceAsUnPaid(invoiceId, reason);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice reversed to unpaid.");
      setUnpayModal(null);
    } catch (err) {
      toast.error(err.message || "Could not reverse payment.");
    }
  };

  const handleGrantOverride = async (studentId, reason) => {
    try {
      await grantFeeOverride(studentId, reason);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Fee override granted.");
      setOverrideModal(null);
    } catch (err) {
      toast.error(err.message || "Could not grant override.");
    }
  };

  const handleRemoveOverride = async (studentId) => {
    const confirm = window.confirm("Remove fee override for this student?");
    if (!confirm) return;
    try {
      await removeFeeOverride(studentId);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Override removed.");
    } catch (err) {
      toast.error(err.message || "Could not remove override.");
    }
  };

  // Stats
  const total = invoices.length;
  const paid = invoices.filter((i) => i.status === "paid").length;
  const unpaid = invoices.filter((i) => i.status === "unpaid").length;
  const overridden = invoices.filter((i) => i.status === "overridden").length;

  return (
    <div>
      {/* Stats strip */}
      {total > 0 && (
        <div className="grid grid-cols-4 mb-7">
          {[
            { label: "Total", value: total, tone: "" },
            { label: "Paid", value: paid, tone: "text-[#5E7A5E]" },
            { label: "Unpaid", value: unpaid, tone: "text-[#8B4A3D]" },
            { label: "Overridden", value: overridden, tone: "text-[#854F0B]" },
          ].map((s, i) => (
            <div key={s.label} className={`px-6 ${i !== 0 ? "border-l border-[#DCD5C7]" : "pl-0"}`}>
              <div className="text-[11px] uppercase tracking-[0.07em] text-[#5C7080] mb-1">{s.label}</div>
              <div className={`font-serif text-[28px] font-medium ${s.tone}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters + generate button */}
      <div className="flex gap-3 mb-5 items-center flex-wrap">
        <input
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          placeholder="Filter by class ID"
          className="text-[13px] border border-[#DCD5C7] rounded-[4px] px-3 py-2 bg-white outline-none w-40"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-[13px] border border-[#DCD5C7] rounded-[4px] px-3 py-2 bg-white outline-none"
        >
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="overridden">Overridden</option>
        </select>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="ml-auto flex items-center gap-1.5 text-[12.5px] font-medium border border-[#DCD5C7] bg-white rounded-[4px] px-3.5 py-2"
        >
          <LuZap size={13} /> Generate invoices
        </button>
      </div>

      {/* Invoices table */}
      {!termId ? (
        <p className="text-[13.5px] text-[#8A98A3]">No active term — set one in School profile.</p>
      ) : isLoading ? (
        <p className="text-[13.5px] text-[#5C7080]">Loading invoices…</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Student", "Class", "Amount", "Status", ""].map((h) => (
                <th key={h} className="text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="py-3 border-b border-[#DCD5C7] text-[13.5px]">
                  {inv.student_name ?? `${inv.first_name ?? ""} ${inv.last_name ?? ""}`.trim()}
                </td>
                <td className="py-3 border-b border-[#DCD5C7] text-[13px] text-[#5C7080]">
                  {inv.class_name ?? inv.class_id ?? "—"}
                </td>
                <td className="py-3 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080]">
                  ₦{Number(inv.amount ?? 0).toLocaleString()}
                </td>
                <td className="py-3 border-b border-[#DCD5C7]">
                  <StatusPill status={inv.status} />
                </td>
                <td className="py-3 border-b border-[#DCD5C7] text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    {inv.status === "unpaid" && (
                      <button
                        onClick={() => setPayModal(inv)}
                        className="flex items-center gap-1 text-[11.5px] font-medium border border-[#DCD5C7] bg-white rounded-[3px] px-2.5 py-1.5 text-[#5E7A5E]"
                      >
                        <LuCheck size={11} /> Mark paid
                      </button>
                    )}
                    {inv.status === "paid" && (
                      <button
                        onClick={() => setUnpayModal(inv)}
                        className="flex items-center gap-1 text-[11.5px] font-medium border border-[#DCD5C7] bg-white rounded-[3px] px-2.5 py-1.5 text-[#8B4A3D]"
                      >
                        <LuX size={11} /> Reverse
                      </button>
                    )}
                    {isPrincipal && inv.status !== "overridden" && (
                      <button
                        onClick={() => setOverrideModal({ id: inv.student_id, name: inv.student_name })}
                        className="flex items-center gap-1 text-[11.5px] font-medium border border-[#DCD5C7] bg-white rounded-[3px] px-2.5 py-1.5"
                      >
                        Override
                      </button>
                    )}
                    {isPrincipal && inv.status === "overridden" && (
                      <button
                        onClick={() => handleRemoveOverride(inv.student_id)}
                        className="flex items-center gap-1 text-[11.5px] font-medium border border-[#DCD5C7] bg-white rounded-[3px] px-2.5 py-1.5 text-[#8B4A3D]"
                      >
                        Remove override
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[13px] text-[#8A98A3]">
                  No invoices found. Generate them above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Modals */}
      {showGenerateModal && (
        <GenerateModal
          termId={termId}
          onClose={() => setShowGenerateModal(false)}
          onGenerated={() => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            setShowGenerateModal(false);
            toast.success("Invoices generated.");
          }}
        />
      )}
      {payModal && (
        <NoteModal
          title={`Mark paid — ${payModal.student_name}`}
          label="Payment note"
          confirmLabel="Mark as paid"
          onClose={() => setPayModal(null)}
          onConfirm={(note) => handleMarkPaid(payModal.id, note)}
        />
      )}
      {unpayModal && (
        <NoteModal
          title={`Reverse payment — ${unpayModal.student_name}`}
          label="Reversal reason"
          confirmLabel="Reverse to unpaid"
          onClose={() => setUnpayModal(null)}
          onConfirm={(reason) => handleMarkUnpaid(unpayModal.id, reason)}
          danger
        />
      )}
      {overrideModal && (
        <NoteModal
          title={`Grant fee override — ${overrideModal.name}`}
          label="Reason for override"
          confirmLabel="Grant override"
          onClose={() => setOverrideModal(null)}
          onConfirm={(reason) => handleGrantOverride(overrideModal.id, reason)}
        />
      )}
    </div>
  );
}

/* ─── Fee types tab ─────────────────────────────────────────────────────── */

function FeeTypesTab({ isPrincipal }) {
  const queryClient = useQueryClient();
  const { data: feeTypes = [], isLoading } = useFeeTypes();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null); // fee type object

  const handleCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["fee-types"] });
    setShowCreate(false);
    toast.success("Fee type created.");
  };

  const handleUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["fee-types"] });
    setEditing(null);
    toast.success("Fee type updated.");
  };

  return (
    <div>
      <div className="flex justify-between items-baseline mb-5">
        <p className="text-[12.5px] text-[#8A98A3]">Fee categories applied when generating invoices</p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 text-[12.5px] font-medium bg-[#1C2630] text-[#FAF8F4] rounded-[4px] px-3.5 py-2"
        >
          <LuPlus size={13} /> Add fee type
        </button>
      </div>

      {isLoading ? (
        <p className="text-[13.5px] text-[#5C7080]">Loading fee types…</p>
      ) : (
        <table className="w-full border-collapse max-w-[760px]">
          <thead>
            <tr>
              {["Name", "Category", "Amount", "Mandatory", "Status", ""].map((h) => (
                <th key={h} className="text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {feeTypes.map((ft) => (
              <tr key={ft.id}>
                <td className="py-3 border-b border-[#DCD5C7] text-[13.5px]">{ft.name}</td>
                <td className="py-3 border-b border-[#DCD5C7] text-[13px] capitalize text-[#5C7080]">{ft.category}</td>
                <td className="py-3 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080]">
                  ₦{Number(ft.amount ?? 0).toLocaleString()}
                </td>
                <td className="py-3 border-b border-[#DCD5C7]">
                  {ft.is_mandatory
                    ? <span className="text-[11px] text-[#5E7A5E]">Yes</span>
                    : <span className="text-[11px] text-[#8A98A3]">No</span>}
                </td>
                <td className="py-3 border-b border-[#DCD5C7]">
                  <span className={`inline-block text-[11px] font-medium rounded-[3px] px-2 py-0.5 ${
                    ft.is_active !== false ? "bg-[#EAEFE6] text-[#5E7A5E]" : "bg-[#F3E7E3] text-[#8B4A3D]"
                  }`}>
                    {ft.is_active !== false ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 border-b border-[#DCD5C7] text-right">
                  <button
                    onClick={() => setEditing(ft)}
                    className="flex items-center gap-1 text-[11.5px] font-medium border border-[#DCD5C7] bg-white rounded-[3px] px-2.5 py-1.5 ml-auto"
                  >
                    <LuPencil size={11} /> Edit
                  </button>
                </td>
              </tr>
            ))}
            {feeTypes.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[13px] text-[#8A98A3]">
                  No fee types yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showCreate && <FeeTypeModal onClose={() => setShowCreate(false)} onDone={handleCreated} />}
      {editing && <FeeTypeModal feeType={editing} onClose={() => setEditing(null)} onDone={handleUpdated} />}
    </div>
  );
}

/* ─── Modals ────────────────────────────────────────────────────────────── */

function GenerateModal({ termId, onClose, onGenerated }) {
  const [classId, setClassId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await createInvoices(termId, classId || undefined);
      onGenerated();
    } catch (err) {
      toast.error(err.message || "Could not generate invoices.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title="Generate invoices" onClose={onClose}>
      <p className="text-[12.5px] text-[#8A98A3] mb-5">
        Generates invoices for the current term. Leave class empty to generate for all classes.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label className="block text-[12px] text-[#5C7080] mb-1.5">Class ID (optional)</label>
          <input
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            placeholder="Leave blank for all classes"
            className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#9C7A3C]"
          />
        </div>
        <button type="submit" disabled={isSaving} className="w-full bg-[#1C2630] text-[#FAF8F4] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60">
          {isSaving ? "Generating…" : "Generate"}
        </button>
      </form>
    </Modal>
  );
}

function FeeTypeModal({ feeType, onClose, onDone }) {
  const isEdit = !!feeType;
  const [form, setForm] = useState({
    name: feeType?.name ?? "",
    category: feeType?.category ?? "",
    amount: feeType?.amount ?? "",
    is_mandatory: feeType?.is_mandatory ?? true,
    is_active: feeType?.is_active ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setCheck = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEdit) {
        await updateFeeType(feeType.id, form.name, Number(form.amount), form.is_mandatory, form.is_active);
      } else {
        await createFeeType(form.name, form.category, Number(form.amount), form.is_mandatory);
      }
      onDone();
    } catch (err) {
      toast.error(err.message || "Could not save fee type.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Edit fee type" : "Add fee type"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <TF label="Name" value={form.name} onChange={set("name")} />
        {!isEdit && <TF label="Category" value={form.category} onChange={set("category")} placeholder="e.g. tuition, levy" />}
        <TF label="Amount (₦)" type="number" value={form.amount} onChange={set("amount")} />

        <div className="flex gap-5 mb-5">
          <label className="flex items-center gap-2 text-[13px] text-[#5C7080] cursor-pointer">
            <input type="checkbox" checked={form.is_mandatory} onChange={setCheck("is_mandatory")} />
            Mandatory
          </label>
          {isEdit && (
            <label className="flex items-center gap-2 text-[13px] text-[#5C7080] cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={setCheck("is_active")} />
              Active
            </label>
          )}
        </div>

        <button type="submit" disabled={isSaving} className="w-full bg-[#1C2630] text-[#FAF8F4] text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60">
          {isSaving ? "Saving…" : isEdit ? "Save changes" : "Create fee type"}
        </button>
      </form>
    </Modal>
  );
}

function NoteModal({ title, label, confirmLabel, onClose, onConfirm, danger }) {
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onConfirm(note);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label className="block text-[12px] text-[#5C7080] mb-1.5">{label}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
            rows={3}
            className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#9C7A3C] resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className={`w-full text-[13.5px] font-medium rounded-[4px] py-2.5 disabled:opacity-60 ${
            danger ? "bg-[#8B4A3D] text-white" : "bg-[#1C2630] text-[#FAF8F4]"
          }`}
        >
          {isSaving ? "Saving…" : confirmLabel}
        </button>
      </form>
    </Modal>
  );
}

/* ─── Shared ─────────────────────────────────────────────────────────────── */

function StatusPill({ status }) {
  const map = {
    paid: "bg-[#EAEFE6] text-[#5E7A5E]",
    unpaid: "bg-[#F3E7E3] text-[#8B4A3D]",
    overridden: "bg-[#FAEEDA] text-[#854F0B]",
  };
  return (
    <span className={`inline-block text-[11px] font-medium rounded-[3px] px-2 py-0.5 capitalize ${map[status] ?? "bg-[#F3F3F3] text-[#8A98A3]"}`}>
      {status ?? "—"}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100] px-6">
      <div className="bg-white rounded-[6px] w-full max-w-[420px] px-7 py-7 relative max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button onClick={onClose} className="absolute top-5 right-5 text-[#8A98A3]">
          <LuX size={18} />
        </button>
        <h2 className="font-serif text-[18px] font-medium mb-5">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function TF({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div className="mb-4">
      <label className="block text-[12px] text-[#5C7080] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full text-[13.5px] border border-[#DCD5C7] rounded-[4px] px-3 py-2.5 outline-none focus:border-[#9C7A3C]"
      />
    </div>
  );
}

export default function FeesPage() {
  return (
    <ProtectedRoute allowedRoles={["principal", "vice_principal", "bursar"]}>
      <FeesContent />
    </ProtectedRoute>
  );
}