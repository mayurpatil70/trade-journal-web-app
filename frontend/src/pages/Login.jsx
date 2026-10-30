// frontend/src/pages/Login.jsx
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import api, { getDeviceId } from "../api/axios";
import { completeSignIn } from "../lib/authFlow";
import { COUNTRIES, guessCountryIso } from "../data/countries";
import {
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Mail,
  Smartphone,
  ChevronDown,
} from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

const inputCls =
  "w-full h-12 px-4 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/10 text-[15px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 disabled:opacity-60";

function errorText(error, fallback) {
  const serverError = error.response?.data?.error;
  if (serverError) return serverError;
  if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
    return "The server took too long to respond. Please try again.";
  }
  return fallback;
}

function passwordProblem(pw) {
  if (pw.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Include at least one letter and one number.";
  return null;
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-black/[0.06] dark:bg-white/[0.08]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`h-9 rounded-[10px] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
            value === o.value
              ? "bg-white dark:bg-white/[0.16] text-gray-900 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, error, hint, children }) {
  return (
    <label className="block text-left">
      <span className="block mb-1.5 ml-1 text-[12px] font-semibold text-gray-600 dark:text-gray-400">{label}</span>
      {children}
      {error ? (
        <span className="block mt-1.5 ml-1 text-[12px] text-red-500">{error}</span>
      ) : hint ? (
        <span className="block mt-1.5 ml-1 text-[12px] text-gray-400 dark:text-gray-500">{hint}</span>
      ) : null}
    </label>
  );
}

function PasswordInput({ value, onChange, disabled, autoComplete, invalid }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} pr-12 ${invalid ? "border-red-500/70" : ""}`}
        placeholder="••••••••"
        autoComplete={autoComplete}
        maxLength={128}
        disabled={disabled}
        required
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
      </button>
    </div>
  );
}

function PhoneInput({ iso, onIsoChange, number, onNumberChange, disabled, invalid }) {
  const country = COUNTRIES.find((c) => c.iso === iso);
  return (
    <div className={`flex rounded-xl border bg-black/[0.04] dark:bg-white/[0.06] transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 ${invalid ? "border-red-500/70" : "border-black/[0.08] dark:border-white/10"}`}>
      <div className="relative shrink-0 border-r border-black/[0.08] dark:border-white/10">
        <div className="h-12 pl-3 pr-7 flex items-center gap-1.5 text-[15px] text-gray-900 dark:text-white pointer-events-none">
          <span>{country?.flag}</span>
          <span>+{country?.dial}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <select
          value={iso}
          onChange={(e) => onIsoChange(e.target.value)}
          disabled={disabled}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Country code"
        >
          {COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.flag} {c.name} (+{c.dial})
            </option>
          ))}
        </select>
      </div>
      <input
        type="tel"
        inputMode="tel"
        value={number}
        onChange={(e) => onNumberChange(e.target.value.replace(/[^\d\s()-]/g, ""))}
        className="flex-1 min-w-0 h-12 px-3 bg-transparent text-[15px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
        placeholder="Phone number"
        autoComplete="tel-national"
        maxLength={20}
        disabled={disabled}
        required
      />
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[13px] font-medium text-left">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

function SubmitButton({ loading, children, loadingText }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full h-12 btn-glossy-green rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" /> {loadingText}
        </>
      ) : (
        <>
          {children} <ArrowRight className="w-[18px] h-[18px]" />
        </>
      )}
    </button>
  );
}

function SignInCard({ onSignedIn, onMagicLink, defaultIso }) {
  const [method, setMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [iso, setIso] = useState(defaultIso);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (method === "email" && !EMAIL_RE.test(email.trim())) return setError("Please enter a valid email address.");
    if (method === "phone" && phone.replace(/\D/g, "").length < 4) return setError("Please enter a valid phone number.");
    if (!password) return setError("Please enter your password.");

    setLoading(true);
    try {
      const deviceId = getDeviceId();
      const payload =
        method === "email"
          ? { method, email: email.trim(), password, deviceId }
          : { method, dialCode: COUNTRIES.find((c) => c.iso === iso)?.dial, phone, password, deviceId };
      const { data } = await api.post("/api/auth/login/password", payload);
      onSignedIn(data, { email: email.trim(), deviceId });
    } catch (err) {
      setError(errorText(err, "Network issue. Please check your connection and try again."));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Segmented
        value={method}
        onChange={(m) => {
          setMethod(m);
          setError("");
        }}
        options={[
          { value: "email", label: "Email", icon: <Mail className="w-3.5 h-3.5" /> },
          { value: "phone", label: "Mobile", icon: <Smartphone className="w-3.5 h-3.5" /> },
        ]}
      />

      {method === "email" ? (
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
            required
          />
        </Field>
      ) : (
        <Field label="Mobile number">
          <PhoneInput iso={iso} onIsoChange={setIso} number={phone} onNumberChange={setPhone} disabled={loading} />
        </Field>
      )}

      <Field label="Password">
        <PasswordInput value={password} onChange={setPassword} disabled={loading} autoComplete="current-password" />
      </Field>

      <ErrorBanner message={error} />

      <SubmitButton loading={loading} loadingText="Signing in...">
        Sign In
      </SubmitButton>

      <button
        type="button"
        onClick={onMagicLink}
        className="w-full text-[13px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
      >
        Email me a sign-in link instead
      </button>
    </form>
  );
}

function RegisterCard({ onSignedIn, defaultIso }) {
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    countryIso: defaultIso,
    city: "",
    phoneIso: defaultIso,
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (value) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Keep the dial code in step with the chosen country until the user picks one separately.
      if (key === "countryIso" && f.phoneIso === f.countryIso) next.phoneIso = value;
      return next;
    });
    setErrors((er) => ({ ...er, [key === "phoneIso" ? "phone" : key === "countryIso" ? "country" : key]: undefined }));
  };

  const strength = useMemo(() => {
    const pw = form.password;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) score++;
    if (pw.length >= 12 && /[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }, [form.password]);

  const validate = () => {
    const er = {};
    if (!EMAIL_RE.test(form.email.trim())) er.email = "Enter a valid email address.";
    if (!USERNAME_RE.test(form.username.trim().toLowerCase())) er.username = "3-20 characters: letters, numbers, dot or underscore.";
    const pwErr = passwordProblem(form.password);
    if (pwErr) er.password = pwErr;
    if (!form.countryIso) er.country = "Select your country.";
    if (form.city.trim().length < 2) er.city = "Enter your city.";
    const digits = form.phone.replace(/\D/g, "").replace(/^0+/, "");
    if (digits.length < 6 || digits.length > 14) er.phone = "Enter a valid phone number.";
    return er;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) return;

    setLoading(true);
    try {
      const deviceId = getDeviceId();
      const { data } = await api.post("/api/auth/register", {
        email: form.email.trim(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
        country: COUNTRIES.find((c) => c.iso === form.countryIso)?.name,
        city: form.city.trim(),
        dialCode: COUNTRIES.find((c) => c.iso === form.phoneIso)?.dial,
        phone: form.phone,
        deviceId,
      });
      onSignedIn(data, { email: form.email.trim().toLowerCase(), deviceId, isNewAccount: true });
    } catch (err) {
      const field = err.response?.data?.field;
      const msg = errorText(err, "Network issue. Please check your connection and try again.");
      if (field) setErrors({ [field]: msg });
      else setError(msg);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Email" error={errors.email}>
        <input
          type="email"
          value={form.email}
          onChange={(e) => set("email")(e.target.value)}
          className={`${inputCls} ${errors.email ? "border-red-500/70" : ""}`}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={loading}
          required
        />
      </Field>

      <Field label="Username" error={errors.username}>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-gray-400">@</span>
          <input
            type="text"
            value={form.username}
            onChange={(e) => set("username")(e.target.value.replace(/\s/g, "").toLowerCase())}
            className={`${inputCls} pl-8 ${errors.username ? "border-red-500/70" : ""}`}
            placeholder="trader_name"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={20}
            disabled={loading}
            required
          />
        </div>
      </Field>

      <Field label="Password" error={errors.password} hint="At least 8 characters with a letter and a number.">
        <PasswordInput
          value={form.password}
          onChange={set("password")}
          disabled={loading}
          autoComplete="new-password"
          invalid={!!errors.password}
        />
        {form.password && (
          <div className="flex gap-1 mt-2 px-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < strength
                    ? ["bg-red-500", "bg-amber-500", "bg-emerald-500"][strength - 1]
                    : "bg-black/10 dark:bg-white/10"
                }`}
              />
            ))}
          </div>
        )}
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Country" error={errors.country}>
          <div className="relative">
            <select
              value={form.countryIso}
              onChange={(e) => set("countryIso")(e.target.value)}
              className={`${inputCls} appearance-none pr-9 cursor-pointer`}
              autoComplete="country"
              disabled={loading}
              required
            >
              {COUNTRIES.map((c) => (
                <option key={c.iso} value={c.iso}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </Field>

        <Field label="City" error={errors.city}>
          <input
            type="text"
            value={form.city}
            onChange={(e) => set("city")(e.target.value)}
            className={`${inputCls} ${errors.city ? "border-red-500/70" : ""}`}
            placeholder="Mumbai"
            autoComplete="address-level2"
            maxLength={80}
            disabled={loading}
            required
          />
        </Field>
      </div>

      <Field label="Mobile number" error={errors.phone}>
        <PhoneInput
          iso={form.phoneIso}
          onIsoChange={set("phoneIso")}
          number={form.phone}
          onNumberChange={set("phone")}
          disabled={loading}
          invalid={!!errors.phone}
        />
      </Field>

      <ErrorBanner message={error} />

      <SubmitButton loading={loading} loadingText="Creating account...">
        Create Account
      </SubmitButton>
    </form>
  );
}

function MagicLinkCard({ onBack }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setErrorMessage("");
    try {
      try {
        await api.post("/api/auth/login", { email });
      } catch (firstError) {
        console.warn("First login attempt failed, retrying...", firstError);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await api.post("/api/auth/login", { email });
      }
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(errorText(error, "Network issue. Please check your connection and try again."));
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-4 animate-in fade-in duration-300">
        <CheckCircle className="w-9 h-9 text-blue-500 mx-auto mb-3" />
        <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white mb-1">Check your inbox</h3>
        <p className="text-[14px] text-gray-500 dark:text-gray-400">
          We sent a secure link to
          <br />
          <span className="font-semibold text-gray-900 dark:text-white">{email}</span>
        </p>
        <button type="button" onClick={onBack} className="mt-6 text-[13px] font-medium text-blue-600 dark:text-blue-400 hover:underline">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center">
        We will email you a one-time link that signs you in for 15 minutes.
      </p>
      <Field label="Email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={status === "loading"}
          required
        />
      </Field>
      <ErrorBanner message={status === "error" ? errorMessage : ""} />
      <SubmitButton loading={status === "loading"} loadingText="Sending...">
        Send Sign-in Link
      </SubmitButton>
      <button type="button" onClick={onBack} className="w-full text-[13px] font-medium text-blue-600 dark:text-blue-400 hover:underline">
        Use password instead
      </button>
    </form>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") === "register" ? "register" : "signin");
  const [magic, setMagic] = useState(false);
  const defaultIso = useMemo(() => guessCountryIso(), []);

  const handleSignedIn = (data, opts) => navigate(completeSignIn(data, opts));

  const titles = {
    signin: ["Welcome back", "Sign in with your email or mobile number."],
    register: ["Create your account", "Start journaling your trades in a minute."],
    magic: ["Sign in with email link", ""],
  };
  const [title, subtitle] = titles[magic ? "magic" : mode];

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-white dark:bg-black flex items-center justify-center px-4 py-10"
      style={{ fontFamily: "var(--font-sans)" }}
    >

      <div className="relative w-full max-w-[440px]">
        <div className="flex justify-center mb-6">
          <BrandLogo width="64" height="51" className="h-14 w-auto" />
        </div>

        <div className="mac-glass-panel !rounded-[28px] p-6 sm:p-8">
          {!magic && (
            <div className="mb-6">
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: "signin", label: "Sign In" },
                  { value: "register", label: "Register" },
                ]}
              />
            </div>
          )}

          <div className="text-center mb-6">
            <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
            {subtitle && <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>

          <div key={magic ? "magic" : mode} className="animate-in fade-in duration-200">
            {magic ? (
              <MagicLinkCard onBack={() => setMagic(false)} />
            ) : mode === "signin" ? (
              <SignInCard onSignedIn={handleSignedIn} onMagicLink={() => setMagic(true)} defaultIso={defaultIso} />
            ) : (
              <RegisterCard onSignedIn={handleSignedIn} defaultIso={defaultIso} />
            )}
          </div>
        </div>

        <p className="mt-5 px-6 text-center text-[12px] leading-relaxed text-gray-500">
          We never share your details with third parties. By continuing you agree to our{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
