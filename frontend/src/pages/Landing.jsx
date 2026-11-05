import { Users, GraduationCap, ClipboardCheck } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Button from "../components/common/Button";
import ServerStatus from "../components/common/ServerStatus";

const modes = [
  {
    icon: Users,
    title: "Free Coding",
    text: "Pair program with friends. See each other's cursors and edits live.",
  },
  {
    icon: GraduationCap,
    title: "Classroom",
    text: "Teachers assign tasks, watch students code and help them in real time.",
  },
  {
    icon: ClipboardCheck,
    title: "Lab Exam",
    text: "Timed, isolated coding environments with transparent monitoring.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-app">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4">
        <section className="py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-6xl">
            Code together,{" "}
            <span className="bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              in real time
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            CodeSync is a collaborative code editor for classrooms and lab
            examinations. Write, run and review code with your team from anywhere.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button to="/register" className="px-6 py-3">Create free account</Button>
            <Button to="/login" variant="secondary" className="px-6 py-3">Log in</Button>
          </div>
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-3">
          {modes.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-line bg-surface p-6">
              <Icon className="mb-4 text-indigo-400" size={28} />
              <h3 className="mb-2 font-semibold text-ink">{title}</h3>
              <p className="text-sm text-muted">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-sm text-muted">
          <span>CodeSync, college mini project</span>
          <ServerStatus />
        </div>
      </footer>
    </div>
  );
}