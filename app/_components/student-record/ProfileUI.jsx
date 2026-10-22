"use client";

import { LuCalendarDays, LuCircleAlert, LuGraduationCap, LuUserRound } from "react-icons/lu";
import styles from "./profile.module.css";
export { styles };

export function displayDate(value) {
  if (!value) return "Not provided";
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? "Not provided" : date.toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", dateStyle: "medium" });
}
export const money = (value) => value == null ? "Not available" : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(Number(value));
export const studentName = (student) => student?.full_name || [student?.first_name, student?.last_name].filter(Boolean).join(" ") || "Student record";
export const studentClass = (student) => student?.class_info?.full_name || student?.class_name || [student?.class_info?.name, student?.class_info?.arm].filter(Boolean).join(" ") || "Not assigned";

export function Badge({ value, label }) {
  const status = String(value ?? "").toLowerCase();
  const labels = { active: "Active student", inactive: "Inactive", pending: "Awaiting approval", rejected: "Rejected", paid: "Paid", unpaid: "Unpaid", partial: "Part paid", approved: "Approved" };
  return <span className={styles.badge} data-status={status}><span aria-hidden="true" />{label || labels[status] || value || "Not available"}</span>;
}

export function ProfileHeader({ student, term, title, actions }) {
  const name = studentName(student);
  const initials = [student?.first_name?.[0], student?.last_name?.[0]].filter(Boolean).join("").toUpperCase();
  const status = student?.is_active === false ? "inactive" : student?.registration_status || (student?.is_active ? "active" : null);
  return <header className={styles.identity}>
    <div className={styles.identityTop}><span className={styles.eyebrow}>{title}</span><span className={styles.term}><LuCalendarDays size={14} />{term?.name || "No current term"}</span></div>
    <div className={styles.identityBody}><div className={styles.avatar} aria-hidden="true">{initials || <LuUserRound size={26} />}</div><div className={styles.identityName}><h1>{name}</h1><div className={styles.identityMeta}><span>{student?.username ? `@${student.username}` : "Student record"}</span><Badge value={status} /></div></div>{actions && <div className={styles.headerActions}>{actions}</div>}</div>
    <dl className={styles.summary}><div><dt>Registration number</dt><dd className={styles.mono}>{student?.reg_number || "Not assigned"}</dd></div><div><dt>Current class</dt><dd>{studentClass(student)}</dd></div><div><dt>School file number</dt><dd>{student?.school_file_number || "Not provided"}</dd></div><div><dt>Academic level</dt><dd>{student?.class_info?.level || "Not provided"}</dd></div></dl>
  </header>;
}

export function Panel({ title, description, icon: Icon, children, id, action }) {
  return <section id={id} className={styles.panel}><div className={styles.panelHeading}><div>{Icon && <span className={styles.sectionIcon}><Icon size={17} /></span>}<div><h2>{title}</h2>{description && <p>{description}</p>}</div></div>{action}</div>{children}</section>;
}

export function Fields({ items }) {
  return <dl className={styles.fields}>{items.map(({ label, value, capitalize, mono }) => <div key={label}><dt>{label}</dt><dd className={`${capitalize ? styles.capitalize : ""} ${mono ? styles.mono : ""}`}>{value === null || value === undefined || value === "" ? <span className={styles.missing}>Not provided</span> : value}</dd></div>)}</dl>;
}

export function Overview({ student }) {
  return <div className={styles.overview}>
    <div className={styles.stack}>
      <Panel id="personal-information" title="Personal information" description="Identity and student details" icon={LuUserRound}><Fields items={[
        { label: "First name", value: student.first_name }, { label: "Last name", value: student.last_name },
        { label: "Gender", value: student.gender, capitalize: true }, { label: "Date of birth", value: displayDate(student.date_of_birth) },
        { label: "Username", value: student.username }, { label: "School file number", value: student.school_file_number },
      ]} /></Panel>
      <Panel id="guardian-information" title="Guardian information" description="Primary contact registered with the school" icon={LuUserRound}><Fields items={[
        { label: "Guardian name", value: student.guardian_name }, { label: "Phone number", value: student.guardian_phone },
        { label: "Email address", value: student.guardian_email },
      ]} /></Panel>
    </div>
    <aside className={styles.stack}>
      <Panel id="enrolment" title="Enrolment" description="Current class placement" icon={LuGraduationCap}>
        <div className={styles.classPlacement}><span className={styles.classSymbol}><LuGraduationCap size={22} /></span><div><strong>{studentClass(student)}</strong><span>{student.class_info?.level || "Class information"}</span></div></div>
        <Fields items={[{ label: "Class name", value: student.class_info?.name }, { label: "Arm", value: student.class_info?.arm }, { label: "Registration number", value: student.reg_number, mono: true }]} />
      </Panel>
      <div className={styles.recordNote}><span className={styles.noteLabel}>Keeping records accurate</span><p>Contact the school administrator if any personal or guardian details need updating.</p></div>
    </aside>
  </div>;
}

export function State({ title, description, error, onRetry, loading }) {
  return <div className={`${styles.state} ${error ? styles.errorState : ""}`} role={error ? "alert" : loading ? "status" : undefined}><span className={styles.stateIcon}>{error ? <LuCircleAlert size={23} /> : <LuGraduationCap size={25} />}</span><h2>{title}</h2>{description && <p>{description}</p>}{onRetry && <button className={styles.secondary} onClick={onRetry}>Try again</button>}</div>;
}

export function Metrics({ items }) {
  return <dl className={styles.metrics}>{items.map(({ label, value, detail }) => <div key={label}><dt>{label}</dt><dd>{value}</dd>{detail && <span>{detail}</span>}</div>)}</dl>;
}

export function InvoiceTable({ invoices }) {
  return <div className={styles.tableWrap}><table><thead><tr><th>Fee description</th><th>Amount</th><th>Payment status</th><th>Paid on</th></tr></thead><tbody>{invoices.map((invoice, index) => <tr key={invoice.id || index}><td><strong>{invoice.fee_type_name || invoice.fee_type?.name || "School fee"}</strong></td><td className={styles.numeric}>{money(invoice.amount)}</td><td><Badge value={invoice.status} /></td><td>{invoice.paid_at ? displayDate(invoice.paid_at) : "Not recorded"}</td></tr>)}</tbody></table></div>;
}
