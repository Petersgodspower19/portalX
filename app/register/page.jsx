"use client";
import Link from "next/link";
import { useState } from "react";
import StudentRegistrationForm from "../_lib/StudentRegistrationForm";
import { LuArrowLeft, LuArrowRight, LuCheck, LuGraduationCap, LuShieldCheck } from "react-icons/lu";
import styles from "./register.module.css";

export default function RegisterPage() {
  const [registered, setRegistered] = useState(false);
  return <main className={styles.page}>
    <aside className={styles.story}>
      <Link href="/login" className={styles.brand}><span className={styles.brandIcon}><LuGraduationCap size={24} /></span><span>PortalX<small>Tarepet Montessori</small></span></Link>
      <div className={styles.storyContent}>
        <span className={styles.eyebrow}>Your next chapter starts here</span>
        <h1>A place to learn.<br />A space to grow.</h1>
        <p>Join your school community and keep your learning journey in one place.</p>
        <div className={styles.preparation}>
          <span className={styles.guideLabel}>Before you begin</span>
          {[
            ["Your school details", "Have your registration code ready. Add your school file number if you have one."],
            ["A username of your own", "Choose a unique username for your student account."],
            ["Your guardian’s contact", "Keep their phone number and email address handy."],
          ].map(([title, description], index) => <div className={styles.guideItem} key={title}>
            <span className={styles.guideNumber}>0{index + 1}</span><div><h2>{title}</h2><p>{description}</p></div>
          </div>)}
        </div>
      </div>
      <div className={styles.storyFooter}><LuShieldCheck size={17} /><span>A thoughtful start to your school journey.</span></div>
    </aside>
    <div className={styles.workspace}>
      <header className={styles.topbar}><Link href="/login"><LuArrowLeft size={15} />Back to sign in</Link><span>Student admissions</span></header>
      <div className={styles.content}>
        {registered ? <section className={styles.success} role="status">
          <span className={styles.successIcon}><LuCheck size={30} /></span>
          <span className={styles.pageEyebrow}>Registration received</span>
          <h2>Awaiting school approval</h2><p>Your registration has been submitted successfully. Your account is awaiting approval from your school. You will be notified once your account has been approved.</p>
          <Link href="/login">Back to sign in <LuArrowRight size={17} /></Link>
        </section> : <>
          <div className={styles.heading}><span className={styles.pageEyebrow}>Student registration</span><h2>Let’s get you started.</h2><p>A few details today. A world of possibilities ahead.</p></div>
          <div className={styles.formCard}><StudentRegistrationForm onRegistered={() => setRegistered(true)} submitLabel="Create student account" /></div>
          <p className={styles.help}>Need a registration code? <span>Contact your school administrator.</span></p>
        </>}
      </div>
      <footer className={styles.footer}><span>PortalX · Tarepet Montessori</span><span>Built around your school community.</span></footer>
    </div>
  </main>;
}
