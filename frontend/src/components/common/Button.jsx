import { Link } from "react-router-dom";

const variants = {
  primary: "bg-indigo-500 text-white hover:bg-indigo-400",
  secondary: "border border-line text-ink hover:bg-surface",
  ghost: "text-muted hover:text-ink",
};

// If `to` is given it renders a router link, otherwise a normal button
export default function Button({ to, variant = "primary", className = "", children, ...props }) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}