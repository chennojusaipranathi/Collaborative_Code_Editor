import Editor from "@monaco-editor/react";
import useTheme from "../../hooks/useTheme";
import { monacoLanguage } from "../../utils/fileLanguage";

export default function MonacoEditor({
  file, onChange, readOnly, editorTheme, fontSize, onMount, onProblems,
}) {
  const { theme } = useTheme();
  const resolvedTheme = editorTheme === "auto" ? (theme === "dark" ? "vs-dark" : "light") : editorTheme;

  return (
    <Editor
      path={file.id}
      language={monacoLanguage(file.name)}
      value={file.content}
      theme={resolvedTheme}
      loading={<p className="text-sm text-muted">Loading editor...</p>}
      onChange={(value) => onChange(file.id, value ?? "")}
      onMount={onMount}
      // Monaco reports errors and warnings here (JS and TS have built-in checking)
      onValidate={onProblems}
      options={{
        readOnly,
        fontSize,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        tabSize: 2,
        wordWrap: "off",
        padding: { top: 12 },
      }}
    />
  );
}