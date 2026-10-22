"use client";
import { useEffect, useState } from "react";
import { checkUsername, registerStudent } from "./auth";
import { LuArrowRight, LuCheck, LuCircleAlert, LuLoaderCircle } from "react-icons/lu";
import styles from "./StudentRegistrationForm.module.css";

const fields = [
  ["registration_code", "Registration code"], ["username", "Student username"],
  ["email", "Student email", "email"],
  ["first_name", "First name"], ["last_name", "Last name"],
  ["gender", "Gender"], ["date_of_birth", "Date of birth", "date"],
  ["guardian_name", "Guardian name"], ["guardian_phone", "Guardian phone", "tel"],
  ["guardian_email", "Guardian email", "email"], ["school_file_number", "School file number"],
];

const sections = [
  { title: "Your school account", description: "Use the details provided by your school.", names: ["registration_code", "school_file_number", "username", "email"] },
  { title: "A little about you", description: "Enter your details as they appear in your school records.", names: ["first_name", "last_name", "gender", "date_of_birth"] },
  { title: "Guardian details", description: "Who should your school contact?", names: ["guardian_name", "guardian_phone", "guardian_email"] },
];
const placeholders = {
  registration_code: "Enter your registration code", school_file_number: "Enter your school file number",
  username: "Choose a username", first_name: "First name", last_name: "Last name",
  email: "student@example.com",
  guardian_name: "Guardian’s full name", guardian_phone: "e.g. 08012345678", guardian_email: "guardian@example.com",
};

export default function StudentRegistrationForm({ onRegistered, submitLabel = "Register student" }) {
  const [form, setForm] = useState(() => Object.fromEntries(fields.map(([key]) => [key, key === "gender" ? "male" : ""])));
  const [availability, setAvailability] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const username = form.username.trim();
  useEffect(() => {
    if (!username) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const available = await checkUsername(username, controller.signal);
        if (!controller.signal.aborted) setAvailability({ username, available });
      } catch (err) {
        if (!controller.signal.aborted) setAvailability({ username, error: err.message });
      }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [username]);
  const status = availability?.username === username ? availability : null;
  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    setError(""); setIsSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
      if (Object.entries(payload).some(([key, value]) => key !== "school_file_number" && !value)) throw new Error("Please fill in all required fields.");
      if (!payload.school_file_number) delete payload.school_file_number;
      const available = await checkUsername(payload.username);
      setAvailability({ username: payload.username, available });
      if (!available) throw new Error("This username is already taken. Choose another username.");
      onRegistered(await registerStudent(payload));
    } catch (err) { setError(err.message || "Could not register student."); }
    finally { setIsSaving(false); }
  }
  return <form onSubmit={handleSubmit} className={styles.form}>
    <p className={styles.requiredNote}>All fields are required unless marked optional.</p>
    {sections.map((section, index) => <fieldset key={section.title} disabled={isSaving} className={styles.section}>
      <legend className={styles.legend}><span className={styles.number}>0{index + 1}</span>{section.title}</legend>
      <p className={styles.description}>{section.description}</p>
      <div className={styles.grid}>
      {section.names.map((fieldName) => {
        const [name, label, type = "text"] = fields.find(([key]) => key === fieldName);
        return <label key={name} className={`${styles.field} ${["username", "email", "guardian_name"].includes(name) ? styles.fullWidth : ""}`}>
        <span className={styles.label}>{label}{name === "school_file_number" ? " (optional)" : ""}</span>
        {name === "gender" ? <select name={name} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} required className={styles.input}>
          <option value="male">Male</option><option value="female">Female</option>
        </select> : <input name={name} type={type} value={form[name]} required={name !== "school_file_number"}
          autoComplete={name === "username" ? "username" : name === "email" ? "email" : undefined}
          placeholder={placeholders[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          aria-describedby={name === "username" ? "username-status" : undefined}
          aria-invalid={name === "username" && status?.available === false ? true : undefined}
          className={styles.input} />}
        {name === "username" && <span id="username-status" role="status" className={`${styles.status} ${status?.available === true ? styles.available : status?.error || status?.available === false ? styles.unavailable : ""}`}>
          {username ? <>{status?.error || status?.available === false ? <LuCircleAlert size={13} /> : status?.available === true ? <LuCheck size={13} /> : <LuLoaderCircle size={13} className={styles.spinner} />}
          {status?.error || (status ? status.available ? "Username is available." : "Username is already taken." : "Checking username...")}</> : "Pick a username that’s easy to remember."}
        </span>}
      </label>; })}
      </div>
    </fieldset>)}
    {error && <p role="alert" className={styles.error}><LuCircleAlert size={16} />{error}</p>}
    <div className={styles.actions}><p>Please check your details before continuing.</p>
    <button type="submit" disabled={isSaving || status?.available === false} className={styles.submit}>
      {isSaving ? <><LuLoaderCircle size={16} className={styles.spinner} />Registering...</> : <>{submitLabel}<LuArrowRight size={16} /></>}
    </button>
    </div>
  </form>;
}
