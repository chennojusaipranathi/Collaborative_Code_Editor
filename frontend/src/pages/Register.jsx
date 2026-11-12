import { useState } from "react";
import { Link,useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import useAuth from "../hooks/useAuth";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (form.name.trim().length < 2) newErrors.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Enter a valid email";
    if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await register(form);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start coding together in minutes">
      <form onSubmit={handleSubmit} noValidate>
        <Input label="Full name" id="name" name="name" value={form.name}
          onChange={handleChange} error={errors.name} placeholder="Sai Kumar" />
        <Input label="Email" id="email" name="email" type="email" value={form.email}
          onChange={handleChange} error={errors.email} placeholder="you@college.edu" />
        <Input label="Password" id="password" name="password" type="password" value={form.password}
          onChange={handleChange} error={errors.password} placeholder="At least 6 characters" />

        <div className="mb-6">
          <label htmlFor="role" className="mb-1 block text-sm font-medium text-ink">I am a</label>
          <select id="role" name="role" value={form.role} onChange={handleChange}
            className="w-full rounded-lg border border-line bg-app px-3 py-2 text-sm text-ink outline-none focus:border-indigo-400">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        {serverError && <p className="mb-4 text-sm text-red-400">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" state={location.state}  className="text-indigo-400 hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}