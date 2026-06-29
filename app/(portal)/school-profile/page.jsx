"use client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    LuBuilding2, LuMapPin, LuQuote, LuPhone, LuMail, LuPencil,
    LuPlus, LuCheck,
} from "react-icons/lu";
import {
    getSchoolProfile, updateSchoolProfile,
    getScoreComponentMaximums, updateScoreMaximums,
    getGradingScheme, replaceFullGradingSystem,
    listAllAcademicSessions, createAcademicSession, setSessionAsCurrent,
    listTermsForSession, createTerm, setTermAsCurrent,
} from "../../_lib/school";
import ProtectedRoute from "../../_lib/ProtectedRoutes";

const TABS = [
    { key: "profile", label: "School details" },
    { key: "scoring", label: "Score maximums" },
    { key: "grading", label: "Grading scheme" },
    { key: "sessions", label: "Sessions & terms" },
];

function SchoolProfileContent() {
    const [tab, setTab] = useState("profile");

    return (
        <div>
            <div className="mb-1.5">
                <h1 className="font-serif text-[27px] font-medium">School profile</h1>
                <p className="text-[12.5px] text-[#5C7080] mt-1">
                    School-wide configuration — principal only
                </p>
            </div>

            <div className="border-b border-[#DCD5C7] mt-5 mb-6 flex gap-1">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`text-[13px] font-medium px-3.5 py-2.5 border-b-2 -mb-px ${tab === t.key
                            ? "border-[#9C7A3C] text-[#1C2630]"
                            : "border-transparent text-[#8A98A3]"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "profile" && <SchoolDetailsSection />}
            {tab === "scoring" && <ScoreMaximumsSection />}
            {tab === "grading" && <GradingSchemeSection />}
            {tab === "sessions" && <SessionsTermsSection />}
        </div>
    );
}

/* ---------------- School details ---------------- */

function SchoolDetailsSection() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ name: "", address: "", motto: "", phone: "", email: "" });

    useEffect(() => {
        (async () => {
            try {
                const data = await getSchoolProfile();
                if (data) setForm(data);
            } catch (err) {
                toast.error(err.message || "Could not load school profile.");
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateSchoolProfile(form.name, form.address, form.motto, form.phone, form.email);
            toast.success("School profile updated.");
            setIsEditing(false);
        } catch (err) {
            toast.error(err.message || "Could not save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <Loading text="Loading school profile…" />;

    return (
        <div>
            <SectionHead
                title="School details"
                sub="Visible on report cards, invoices, and login pages"
                action={!isEditing && <EditButton onClick={() => setIsEditing(true)} />}
            />
            <Card>
                <form onSubmit={handleSave}>
                    <Field label="School name" icon={LuBuilding2} value={form.name} onChange={handleChange("name")} disabled={!isEditing} />
                    <Field label="Address" icon={LuMapPin} value={form.address} onChange={handleChange("address")} disabled={!isEditing} />
                    <Field label="Motto" icon={LuQuote} value={form.motto} onChange={handleChange("motto")} disabled={!isEditing} />
                    <Field label="Phone" icon={LuPhone} value={form.phone} onChange={handleChange("phone")} disabled={!isEditing} />
                    <Field label="Email" icon={LuMail} type="email" value={form.email} onChange={handleChange("email")} disabled={!isEditing} />
                    {isEditing && <SaveCancelRow isSaving={isSaving} onCancel={() => setIsEditing(false)} />}
                </form>
            </Card>
        </div>
    );
}

/* ---------------- Score maximums ---------------- */

function ScoreMaximumsSection() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ ca1_max: "", ca2_max: "", exam_max: "" });

    useEffect(() => {
        (async () => {
            try {
                const data = await getScoreComponentMaximums();
                if (data) setForm(data);
            } catch (err) {
                toast.error(err.message || "Could not load score maximums.");
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const total = [form.ca1_max, form.ca2_max, form.exam_max]
        .map((v) => Number(v) || 0)
        .reduce((a, b) => a + b, 0);

    const handleSave = async (e) => {
        e.preventDefault();
        if (total !== 100) {
            toast.error(`Components must total 100 (currently ${total}).`);
            return;
        }
        setIsSaving(true);
        try {
            await updateScoreMaximums(Number(form.ca1_max), Number(form.ca2_max), Number(form.exam_max));
            toast.success("Score maximums updated.");
            setIsEditing(false);
        } catch (err) {
            toast.error(err.message || "Could not save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <Loading text="Loading score configuration…" />;

    return (
        <div>
            <SectionHead
                title="Score component maximums"
                sub="How CA1, CA2, and exam scores are weighted per subject — must total 100"
                action={!isEditing && <EditButton onClick={() => setIsEditing(true)} />}
            />
            <Card>
                <form onSubmit={handleSave}>
                    <div className="grid grid-cols-3 gap-4 mb-2">
                        <NumberField label="CA1 max" value={form.ca1_max} onChange={handleChange("ca1_max")} disabled={!isEditing} />
                        <NumberField label="CA2 max" value={form.ca2_max} onChange={handleChange("ca2_max")} disabled={!isEditing} />
                        <NumberField label="Exam max" value={form.exam_max} onChange={handleChange("exam_max")} disabled={!isEditing} />
                    </div>
                    <p className={`text-[12px] mt-2 mb-4 font-mono ${total === 100 ? "text-[#5E7A5E]" : "text-[#8B4A3D]"}`}>
                        Total: {total} / 100
                    </p>
                    {isEditing && <SaveCancelRow isSaving={isSaving} onCancel={() => setIsEditing(false)} />}
                </form>
            </Card>
        </div>
    );
}

/* ---------------- Grading scheme ---------------- */

function GradingSchemeSection() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [bands, setBands] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const data = await getGradingScheme();
                if (data?.bands) setBands(data.bands);
            } catch (err) {
                toast.error(err.message || "Could not load grading scheme.");
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const updateBand = (i, field) => (e) => {
        const value = field === "grade" ? e.target.value : Number(e.target.value);
        setBands((b) => b.map((band, idx) => (idx === i ? { ...band, [field]: value } : band)));
    };

    const addBand = () => setBands((b) => [...b, { grade: "", min_score: "", max_score: "" }]);
    const removeBand = (i) => setBands((b) => b.filter((_, idx) => idx !== i));

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await replaceFullGradingSystem(bands);
            toast.success("Grading scheme updated.");
            setIsEditing(false);
        } catch (err) {
            toast.error(err.message || "Could not save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <Loading text="Loading grading scheme…" />;

    return (
        <div>
            <SectionHead
                title="Grading scheme"
                sub="Grade bands used across all result sheets — replacing this affects every class"
                action={!isEditing && <EditButton onClick={() => setIsEditing(true)} />}
            />
            <Card wide>
                <form onSubmit={handleSave}>
                    <table className="w-full border-collapse mb-4">
                        <thead>
                            <tr>
                                {["Grade", "Min score", "Max score", ""].map((h) => (
                                    <th key={h} className="text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7]">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bands.map((band, i) => (
                                <tr key={i}>
                                    <td className="py-2.5 border-b border-[#DCD5C7] pr-3">
                                        <InlineInput value={band.grade} onChange={updateBand(i, "grade")} disabled={!isEditing} width="w-16" />
                                    </td>
                                    <td className="py-2.5 border-b border-[#DCD5C7] pr-3">
                                        <InlineInput type="number" value={band.min_score} onChange={updateBand(i, "min_score")} disabled={!isEditing} />
                                    </td>
                                    <td className="py-2.5 border-b border-[#DCD5C7] pr-3">
                                        <InlineInput type="number" value={band.max_score} onChange={updateBand(i, "max_score")} disabled={!isEditing} />
                                    </td>
                                    <td className="py-2.5 border-b border-[#DCD5C7] text-right">
                                        {isEditing && (
                                            <button type="button" onClick={() => removeBand(i)} className="text-[11.5px] text-[#8B4A3D]">
                                                Remove
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {isEditing && (
                        <button
                            type="button"
                            onClick={addBand}
                            className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#9C7A3C] mb-5"
                        >
                            <LuPlus size={13} /> Add band
                        </button>
                    )}

                    {isEditing && <SaveCancelRow isSaving={isSaving} onCancel={() => setIsEditing(false)} />}
                </form>
            </Card>
        </div>
    );
}

/* ---------------- Sessions & terms ---------------- */

function SessionsTermsSection() {
    const [isLoading, setIsLoading] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [terms, setTerms] = useState([]);
    const [termsLoading, setTermsLoading] = useState(false);

    const [newSession, setNewSession] = useState({ name: "", year: "" });
    const [creatingSession, setCreatingSession] = useState(false);

    const [newTerm, setNewTerm] = useState({ term_number: "", name: "", start_date: "", end_date: "" });
    const [creatingTerm, setCreatingTerm] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await listAllAcademicSessions();
                const list = data?.sessions ?? data ?? [];
                setSessions(list);
                if (list.length) setSelectedSessionId(list[0].id);
            } catch (err) {
                toast.error(err.message || "Could not load academic sessions.");
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (!selectedSessionId) return;
        setTermsLoading(true);
        listTermsForSession(selectedSessionId)
            .then((data) => setTerms(data?.terms ?? data ?? []))
            .catch((err) => toast.error(err.message || "Could not load terms."))
            .finally(() => setTermsLoading(false));
    }, [selectedSessionId]);

    const handleCreateSession = async (e) => {
        e.preventDefault();
        setCreatingSession(true);
        try {
            const created = await createAcademicSession(newSession.name, Number(newSession.year));
            toast.success("Session created.");
            setSessions((s) => [...s, created]);
            setNewSession({ name: "", year: "" });
        } catch (err) {
            toast.error(err.message || "Could not create session.");
        } finally {
            setCreatingSession(false);
        }
    };

    const handleSetSessionCurrent = async (sessionId) => {
        try {
            await setSessionAsCurrent(sessionId);
            toast.success("Session set as current.");
            setSessions((s) => s.map((sess) => ({ ...sess, is_current: sess.id === sessionId })));
        } catch (err) {
            toast.error(err.message || "Could not update session.");
        }
    };

    const handleCreateTerm = async (e) => {
        e.preventDefault();
        setCreatingTerm(true);
        try {
            const created = await createTerm(
                selectedSessionId,
                Number(newTerm.term_number),
                newTerm.name,
                newTerm.start_date,
                newTerm.end_date
            );
            toast.success("Term created.");
            setTerms((t) => [...t, created]);
            setNewTerm({ term_number: "", name: "", start_date: "", end_date: "" });
        } catch (err) {
            toast.error(err.message || "Could not create term.");
        } finally {
            setCreatingTerm(false);
        }
    };

    const handleSetTermCurrent = async (termId) => {
        try {
            await setTermAsCurrent(termId);
            toast.success("Term set as current.");
            setTerms((t) => t.map((term) => ({ ...term, is_current: term.id === termId })));
        } catch (err) {
            toast.error(err.message || "Could not update term.");
        }
    };

    if (isLoading) return <Loading text="Loading sessions…" />;

    return (
        <div>
            <SectionHead title="Academic sessions" sub="Sessions group terms together — only one can be current" />
            <Card wide>
                <table className="w-full border-collapse mb-5">
                    <thead>
                        <tr>
                            {["Session", "Year", "Status", ""].map((h) => (
                                <th key={h} className="text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7]">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((s) => (
                            <tr
                                key={s.id}
                                onClick={() => setSelectedSessionId(s.id)}
                                className={`cursor-pointer ${selectedSessionId === s.id ? "bg-[#FAEEDA]/40" : ""}`}
                            >
                                <td className="py-2.5 border-b border-[#DCD5C7] text-[13.5px]">{s.name}</td>
                                <td className="py-2.5 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080]">{s.year}</td>
                                <td className="py-2.5 border-b border-[#DCD5C7]">
                                    {s.is_current ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#EAEFE6] text-[#5E7A5E] rounded-[3px] px-2 py-0.5">
                                            <LuCheck size={11} /> Current
                                        </span>
                                    ) : (
                                        <span className="text-[11.5px] text-[#8A98A3]">Inactive</span>
                                    )}
                                </td>
                                <td className="py-2.5 border-b border-[#DCD5C7] text-right">
                                    {!s.is_current && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSetSessionCurrent(s.id); }}
                                            className="text-[12px] font-medium border border-[#DCD5C7] bg-white rounded-[3px] px-2.5 py-1"
                                        >
                                            Set current
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <form onSubmit={handleCreateSession} className="flex gap-2 items-end">
                    <InlineLabelInput label="Name" placeholder="2025/2026" value={newSession.name} onChange={(e) => setNewSession((s) => ({ ...s, name: e.target.value }))} />
                    <InlineLabelInput label="Year" type="number" placeholder="2025" value={newSession.year} onChange={(e) => setNewSession((s) => ({ ...s, year: e.target.value }))} />
                    <button
                        type="submit"
                        disabled={creatingSession}
                        className="flex items-center gap-1.5 text-[12.5px] font-medium bg-[#1C2630] text-[#FAF8F4] rounded-[4px] px-3.5 py-2.5 disabled:opacity-60"
                    >
                        <LuPlus size={13} /> {creatingSession ? "Adding…" : "Add session"}
                    </button>
                </form>
            </Card>

            <SectionHead
                title="Terms"
                sub={selectedSessionId ? `Terms within the selected session` : "Select a session above"}
            />
            <Card wide>
                {termsLoading ? (
                    <Loading text="Loading terms…" />
                ) : (
                    <>
                        <table className="w-full border-collapse mb-5">
                            <thead>
                                <tr>
                                    {["Term", "Dates", "Status", ""].map((h) => (
                                        <th key={h} className="text-left text-[11px] uppercase tracking-[0.06em] text-[#5C7080] font-medium pb-2.5 border-b border-[#DCD5C7]">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {terms.map((t) => (
                                    <tr key={t.id}>
                                        <td className="py-2.5 border-b border-[#DCD5C7] text-[13.5px]">{t.name}</td>
                                        <td className="py-2.5 border-b border-[#DCD5C7] text-[12.5px] font-mono text-[#5C7080]">
                                            {t.start_date} → {t.end_date}
                                        </td>
                                        <td className="py-2.5 border-b border-[#DCD5C7]">
                                            {t.is_current ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#EAEFE6] text-[#5E7A5E] rounded-[3px] px-2 py-0.5">
                                                    <LuCheck size={11} /> Current
                                                </span>
                                            ) : (
                                                <span className="text-[11.5px] text-[#8A98A3]">Inactive</span>
                                            )}
                                        </td>
                                        <td className="py-2.5 border-b border-[#DCD5C7] text-right">
                                            {!t.is_current && (
                                                <button
                                                    onClick={() => handleSetTermCurrent(t.id)}
                                                    className="text-[12px] font-medium border border-[#DCD5C7] bg-white rounded-[3px] px-2.5 py-1"
                                                >
                                                    Set current
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <form onSubmit={handleCreateTerm} className="flex gap-2 items-end flex-wrap">
                            <InlineLabelInput label="Term #" type="number" placeholder="1" value={newTerm.term_number} onChange={(e) => setNewTerm((t) => ({ ...t, term_number: e.target.value }))} width="w-16" />
                            <InlineLabelInput label="Name" placeholder="First Term" value={newTerm.name} onChange={(e) => setNewTerm((t) => ({ ...t, name: e.target.value }))} />
                            <InlineLabelInput label="Start" type="date" value={newTerm.start_date} onChange={(e) => setNewTerm((t) => ({ ...t, start_date: e.target.value }))} />
                            <InlineLabelInput label="End" type="date" value={newTerm.end_date} onChange={(e) => setNewTerm((t) => ({ ...t, end_date: e.target.value }))} />
                            <button
                                type="submit"
                                disabled={creatingTerm || !selectedSessionId}
                                className="flex items-center gap-1.5 text-[12.5px] font-medium bg-[#1C2630] text-[#FAF8F4] rounded-[4px] px-3.5 py-2.5 disabled:opacity-60"
                            >
                                <LuPlus size={13} /> {creatingTerm ? "Adding…" : "Add term"}
                            </button>
                        </form>
                    </>
                )}
            </Card>
        </div>
    );
}

/* ---------------- Shared bits ---------------- */

function SectionHead({ title, sub, action }) {
    return (
        <div className="flex justify-between items-end mb-4">
            <div>
                <h2 className="font-serif text-[18px] font-medium">{title}</h2>
                {sub && <p className="text-[12px] text-[#8A98A3] mt-0.5">{sub}</p>}
            </div>
            {action}
        </div>
    );
}

function Card({ children, wide }) {
    return (
        <div className={`bg-white border border-[#DCD5C7] rounded-[6px] px-7 py-7 mb-9 ${wide ? "" : "max-w-[560px]"}`}>
            {children}
        </div>
    );
}

function EditButton({ onClick }) {
    return (
        <button onClick={onClick} className="flex items-center gap-1.5 text-[12.5px] font-medium border border-[#DCD5C7] bg-white rounded-[4px] px-3.5 py-2">
            <LuPencil size={13} /> Edit
        </button>
    );
}

function SaveCancelRow({ isSaving, onCancel }) {
    return (
        <div className="flex gap-2 mt-2">
            <button type="submit" disabled={isSaving} className="bg-[#1C2630] text-[#FAF8F4] text-[13.5px] font-medium rounded-[4px] px-4 py-2.5 disabled:opacity-60">
                {isSaving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={onCancel} className="text-[13.5px] font-medium border border-[#DCD5C7] bg-white rounded-[4px] px-4 py-2.5">
                Cancel
            </button>
        </div>
    );
}

function Loading({ text }) {
    return <p className="text-[13.5px] text-[#5C7080]">{text}</p>;
}

function Field({ label, icon: Icon, type = "text", value, onChange, disabled }) {
    return (
        <div className="mb-4">
            <label className="block text-[12px] text-[#5C7080] mb-1.5">{label}</label>
            <div className={`flex items-center gap-2 border rounded-[4px] px-3 py-2.5 ${disabled ? "border-[#DCD5C7] bg-[#FAF8F4]" : "border-[#DCD5C7] focus-within:border-[#9C7A3C]"}`}>
                <Icon size={15} className="text-[#8A98A3] shrink-0" />
                <input
                    type={type}
                    value={value || ""}
                    onChange={onChange}
                    disabled={disabled}
                    className="w-full text-[13.5px] outline-none bg-transparent disabled:text-[#5C7080]"
                />
            </div>
        </div>
    );
}

function NumberField({ label, value, onChange, disabled }) {
    return (
        <div>
            <label className="block text-[12px] text-[#5C7080] mb-1.5">{label}</label>
            <input
                type="number"
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full text-[13.5px] font-mono border rounded-[4px] px-3 py-2.5 outline-none ${disabled ? "border-[#DCD5C7] bg-[#FAF8F4] text-[#5C7080]" : "border-[#DCD5C7] focus:border-[#9C7A3C]"}`}
            />
        </div>
    );
}

function InlineInput({ type = "text", value, onChange, disabled, width = "w-20" }) {
    return (
        <input
            type={type}
            value={value ?? ""}
            onChange={onChange}
            disabled={disabled}
            className={`${width} text-[13px] font-mono border rounded-[3px] px-2 py-1.5 outline-none ${disabled ? "border-transparent bg-transparent text-[#1C2630]" : "border-[#DCD5C7] focus:border-[#9C7A3C]"}`}
        />
    );
}

function InlineLabelInput({ label, type = "text", placeholder, value, onChange, width = "w-32" }) {
    return (
        <div>
            <label className="block text-[11px] text-[#8A98A3] mb-1">{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={`${width} text-[13px] border border-[#DCD5C7] rounded-[4px] px-2.5 py-2 outline-none focus:border-[#9C7A3C]`}
            />
        </div>
    );
}

export default function SchoolProfilePage() {
    return (
        <ProtectedRoute allowedRoles={["principal"]}>
            <SchoolProfileContent />
        </ProtectedRoute>
    );
}