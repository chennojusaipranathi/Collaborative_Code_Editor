import Editor from "@monaco-editor/react";
import useTheme from "../../hooks/useTheme";
import { monacoLanguage } from "../../utils/fileLanguage";

export default function MonacoEditor({ file, onChange, readOnly }) {
  const { theme } = useTheme();

  return (
    <Editor
      // path gives every file its own model, so undo history and scroll
      // position are kept separately per file
      path={file.id}
      language={monacoLanguage(file.name)}
      value={file.content}
      theme={theme === "dark" ? "vs-dark" : "light"}
      loading={<p className="text-sm text-muted">Loading editor...</p>}
      onChange={(value) => onChange(file.id, value ?? "")}
      options={{
        readOnly,
        fontSize: 14,
        minimap: { enabled: false },
        automaticLayout: true, // resizes with the panel
        scrollBeyondLastLine: false,
        tabSize: 2,
        wordWrap: "off",
        padding: { top: 12 },
      }}
    />
  );
}