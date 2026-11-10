import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Check, Play, Loader2, History, Eye, ClipboardCheck, ListChecks, Wand2 } from "lucide-react";
import ThemeToggle from "../common/ThemeToggle";
import { ROOM_MODES } from "../../utils/roomModes";
import { languageFromFileName } from "../../utils/fileLanguage";
import { THEME_OPTIONS, FONT_SIZES } from "../../utils/editorSettings";

const linkClass =
    "hidden items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-ink sm:flex";

export default function EditorToolbar({ room, activeFile, running, onRun, isTeacher, saveState,
    settings, onSettingsChange, onFormat, canEdit }) {
    const [copied, setCopied] = useState(false);
    const mode = ROOM_MODES[room.mode];

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(room.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard can be blocked; the code is still visible on screen
        }
    };

    return (
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-surface px-3">
            <div className="flex min-w-0 items-center gap-3">
                <Link to="/dashboard" aria-label="Back to dashboard" className="text-muted hover:text-ink">
                    <ArrowLeft size={18} />
                </Link>
                <h1 className="truncate text-sm font-semibold text-ink">{room.name}</h1>
                <span className={`hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline ${mode.color}`}>
                    {mode.label}
                </span>
                <button
                    onClick={copyCode}
                    className="hidden items-center gap-1 rounded border border-line px-2 py-0.5 font-mono text-xs text-muted hover:text-ink sm:flex"
                >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {room.code}
                </button>
            </div>

            <div className="flex items-center gap-2">
                <span
                    className={`hidden text-xs sm:inline ${saveState === "error" ? "text-red-400" : saveState === "offline" ? "text-amber-400" : "text-muted"
                        }`}
                >
                    {saveState === "saved" && "Live · changes saved automatically"}
                    {saveState === "offline" && "Offline · reconnecting..."}
                    {saveState === "error" && "Connection error"}
                </span>
                {activeFile && (
                    <span className="hidden text-xs text-muted md:inline">
                        {languageFromFileName(activeFile.name)}
                    </span>
                )}

                <select
                    value={settings.theme}
                    onChange={(e) => onSettingsChange({ ...settings, theme: e.target.value })}
                    aria-label="Editor theme"
                    className="hidden rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink lg:block"
                >
                    {THEME_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
                <select
                    value={settings.fontSize}
                    onChange={(e) => onSettingsChange({ ...settings, fontSize: Number(e.target.value) })}
                    aria-label="Font size"
                    className="hidden rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink lg:block"
                >
                    {FONT_SIZES.map((s) => (
                        <option key={s} value={s}>{s}px</option>
                    ))}
                </select>
                <button
                    onClick={onFormat}
                    disabled={!activeFile || !canEdit}
                    className="hidden items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-ink disabled:opacity-50 sm:flex"
                >
                    <Wand2 size={14} /> Format
                </button>

                <Link to={`/room/${room.id}/history`} className={linkClass}>
                    <History size={14} /> History
                </Link>
                {isTeacher && room.mode === "classroom" && (
                    <Link to={`/room/${room.id}/monitor`} className={linkClass}>
                        <Eye size={14} /> Monitor
                    </Link>
                )}

                {room.mode === "exam" && !isTeacher && (
                    <Link to={`/room/${room.id}/exam`} className={linkClass}>
                        <ClipboardCheck size={14} /> Take exam
                    </Link>
                )}
                {room.mode === "exam" && (
                    <Link to={`/room/${room.id}/submissions`} className={linkClass}>
                        <ListChecks size={14} /> Submissions
                    </Link>
                )}

                <button
                    onClick={onRun}
                    disabled={running || !activeFile || !canEdit}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-400 disabled:opacity-50"
                >
                    {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    {running ? "Running" : "Run"}
                </button>
                <ThemeToggle />
            </div>
        </header>
    );
}