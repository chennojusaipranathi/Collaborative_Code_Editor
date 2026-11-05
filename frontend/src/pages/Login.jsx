import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import useAuth from "../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // One handler for all inputs: uses the input's `name` to know which field changed
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Enter a valid email";
    if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    setServerError("");

    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue to CodeSync">
      <form onSubmit={handleSubmit} noValidate>
        <Input label="Email" id="email" name="email" type="email" value={form.email}
          onChange={handleChange} error={errors.email} placeholder="you@college.edu" />
        <Input label="Password" id="password" name="password" type="password" value={form.password}
          onChange={handleChange} error={errors.password} placeholder="At least 6 characters" />

        {serverError && <p className="mb-4 text-sm text-red-400">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New to CodeSync?{" "}
        <Link to="/register" className="text-indigo-400 hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
}