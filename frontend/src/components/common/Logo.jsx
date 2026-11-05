import { Link } from "react-router-dom";
import { Code2 } from "lucide-react";

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-bold text-ink">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-500 text-white">
        <Code2 size={18} />
      </span>
      <span className="text-lg">CodeSync</span>
    </Link>
  );
}