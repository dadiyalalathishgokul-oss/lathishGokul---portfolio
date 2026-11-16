import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Award,
  Check,
  Copy,
  Download,
  GraduationCap,
  Mail,
  MapPin,
  Moon,
  Navigation,
  Send,
  Sun,
} from 'lucide-react';
import { ProjectModal } from './components/ProjectModal';
import { PythonDsaLab } from './components/PythonDsaLab';
import { ResilientImage } from './components/ResilientImage';
import type {
  GpaForecast,
  PortfolioApiResponse,
  ProjectSpec,
  TransitRouteResult,
} from './types/portfolio';

export default function App() {
  const [data, setData] = useState<PortfolioApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  const [activeSkillId, setActiveSkillId] = useState<string>('dsa');
  const [selectedProject, setSelectedProject] = useState<ProjectSpec | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Interactive Python GPA Forecast state
  const [targetCgpa, setTargetCgpa] = useState<number>(8.5);
  const [forecast, setForecast] = useState<GpaForecast | null>(null);

  // Interactive Jain Transit Python Router state
  const [transitFrom, setTransitFrom] = useState('Main Gate');
  const [transitTo, setTransitTo] = useState('AI & ML Lab');
  const [transitRoute, setTransitRoute] = useState<TransitRouteResult | null>(null);
  const [routingBusy, setRoutingBusy] = useState(false);

  // Contact Inquiry Form backed by Python SQLite store
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [inquiryType, setInquiryType] = useState('Internship');
  const [message, setMessage] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquiryStatus, setInquiryStatus] = useState<{
    kind: 'ok' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    let active = true;
    fetch('/api/py/portfolio')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as PortfolioApiResponse;
      })
      .then((payload) => {
        if (!active) return;
        setData(payload);
        setForecast(payload.default_forecast);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadError('Unable to load portfolio data from the Python backend.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    let active = true;
    fetch(`/api/py/gpa-forecast?target=${targetCgpa.toFixed(2)}&semesters=8`)
      .then((res) => res.json())
      .then((resData: GpaForecast) => {
        if (active && resData.trajectory) setForecast(resData);
      })
      .catch(() => {
        // Keep previous forecast on transient error
      });
    return () => {
      active = false;
    };
  }, [targetCgpa, data]);

  const solveTransit = async (fromStop: string, toStop: string) => {
    setRoutingBusy(true);
    try {
      const qs = new URLSearchParams({ start: fromStop, destination: toStop });
      const res = await fetch(`/api/py/transit-sim?${qs.toString()}`);
      const json = (await res.json()) as TransitRouteResult;
      setTransitRoute(json);
    } catch {
      setTransitRoute({ found: false, error: 'Transit solver unreachable.' });
    } finally {
      setRoutingBusy(false);
    }
  };

  useEffect(() => {
    if (data) {
      void solveTransit(transitFrom, transitTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // Fallback ignored in restricted clipboard environments
    }
  };

  const handleInquirySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittingInquiry(true);
    setInquiryStatus(null);
    try {
      const res = await fetch('/api/py/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: senderName,
          email: senderEmail,
          organization,
          inquiry_type: inquiryType,
          message,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setInquiryStatus({ kind: 'error', text: json.error || 'Could not submit inquiry.' });
      } else {
        setInquiryStatus({
          kind: 'ok',
          text: `Saved in Python SQLite store (Receipt #${json.receipt.id}). Thank you for reaching out.`,
        });
        setSenderName('');
        setSenderEmail('');
        setOrganization('');
        setMessage('');
      }
    } catch {
      setInquiryStatus({ kind: 'error', text: 'Network error reaching Python backend.' });
    } finally {
      setSubmittingInquiry(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center p-6">
        <div className="text-sm text-[var(--muted)]">Loading Python portfolio workspace...</div>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center space-y-3">
          <h1 className="font-display text-xl font-bold">Connection Error</h1>
          <p className="text-sm text-[var(--muted)]">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white dark:text-[#091518] text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { profile, academic_summary: academics, transit_stops: transitStops, language_stats: langStats, runtime } = data;
  const activeSkill = profile.skills.find((s) => s.id === activeSkillId) ?? profile.skills[0];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] transition-colors duration-200">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-base sm:text-lg font-bold tracking-tight text-[var(--ink)] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            Dadiyala Lathish Gokul
          </a>

          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--muted)]"
          >
            <a
              href="#about"
              className="hover:text-[var(--ink)] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              About
            </a>
            <a
              href="#education"
              className="hover:text-[var(--ink)] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Education
            </a>
            <a
              href="#projects"
              className="hover:text-[var(--ink)] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Projects
            </a>
            <a
              href="#python-lab"
              className="hover:text-[var(--ink)] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Python Lab
            </a>
            <a
              href="#contact"
              className="hover:text-[var(--ink)] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Contact
            </a>
          </nav>

          <a
            href="#contact"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white dark:text-[#091518] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            Get in Touch
          </a>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-10 sm:py-14 space-y-20">
        {/* Hero Split + Full-Width 4-Column Metric Strip */}
        <section className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8 py-2">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
                    <MapPin className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                    <span>
                      {profile.location} · {profile.university}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setDarkMode((prev) => !prev)}
                    aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-alt)] transition-colors whitespace-nowrap shrink-0"
                  >
                    {darkMode ? (
                      <>
                        <Sun className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </button>
                </div>

                <h1
                  className="font-display font-extrabold tracking-tight text-[var(--ink)] leading-[1.06]"
                  style={{
                    fontSize: 'clamp(2.35rem, 4.4vw, 3.85rem)',
                    textWrap: 'balance',
                  }}
                >
                  {profile.name}
                </h1>

                <p className="text-lg sm:text-xl text-[var(--muted)] leading-relaxed max-w-[46ch]">
                  {profile.headline}
                </p>

                <p className="text-[15px] text-[var(--muted)] leading-relaxed max-w-[58ch]">
                  Re-engineered as a Python-powered portfolio where live Python {runtime.version} backend
                  services drive DSA algorithm execution, campus shuttle routing, and academic trajectory forecasting.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#python-lab"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white dark:text-[#091518] text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Explore Python Lab</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>

                <button
                  type="button"
                  onClick={() => void handleCopyEmail(profile.email)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-alt)] text-sm font-medium text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                      <span>Email Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[var(--muted)]" aria-hidden="true" />
                      <span>{profile.email}</span>
                    </>
                  )}
                </button>

                <a
                  href="/api/py/resume"
                  download="Dadiyala_Lathish_Gokul_Resume.md"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-alt)] text-sm font-medium text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                  <span>Resume (.md)</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="h-full min-h-[280px] rounded-2xl overflow-hidden border border-[var(--line)] bg-[var(--surface)]">
                <ResilientImage
                  src="/src/assets/images/hero_developer_studio_1794852973405.jpg"
                  alt="Dadiyala Lathish Gokul coding at a study desk"
                  fallbackTitle="Dadiyala Lathish Gokul"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 4-Column Full-Width Metric Strip Below Hero Split */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--ink)] tabular-nums">
                {academics.latest_sgpa.toFixed(3)} / 10
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                Semester 2 SGPA (+{academics.semester_delta.toFixed(3)} from Sem 1)
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                {profile.year_of_study}
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                {profile.degree}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--ink)] tabular-nums">
                Python {runtime.version}
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                Active Backend, SQLite &amp; DSA Engine
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--accent)] tabular-nums">
                {langStats.python_percentage}% Python
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                Verified Live Source Share
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: About & Interactive Python Skills */}
        <section id="about" className="pt-12 border-t border-[var(--line)] space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-3">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                About &amp; Core Skills
              </h2>
              <p className="text-[15px] leading-relaxed text-[var(--muted)]">
                {profile.about}
              </p>
              <p className="text-xs font-medium text-[var(--accent)] pt-1">
                {profile.availability}
              </p>
            </div>

            <div className="lg:col-span-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
              <div className="flex flex-wrap gap-1.5 p-3 border-b border-[var(--line)] bg-[var(--surface-alt)]">
                {profile.skills.map((skill) => {
                  const selected = skill.id === activeSkill.id;
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => setActiveSkillId(skill.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        selected
                          ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {skill.title}
                    </button>
                  );
                })}
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <h3 className="font-display text-xl font-bold text-[var(--ink)]">
                    {activeSkill.title}
                  </h3>
                  <p className="text-[15px] text-[var(--muted)] leading-relaxed">
                    {activeSkill.summary}
                  </p>
                  <p className="text-xs text-[var(--accent)] font-medium">
                    {activeSkill.python_focus}
                  </p>
                </div>

                <pre className="p-4 rounded-xl bg-[var(--code-bg)] text-[var(--code-ink)] text-xs font-mono-code overflow-x-auto leading-relaxed">
                  <code>{activeSkill.code_example}</code>
                </pre>

                <div className="text-xs text-[var(--muted)] pt-1">
                  {activeSkill.tools.join(' · ')}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Education & Live Python CGPA Forecast */}
        <section id="education" className="pt-12 border-t border-[var(--line)] space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
                <GraduationCap className="w-4 h-4" aria-hidden="true" />
                <span>Academic Progression</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                {profile.university}
              </h2>
              <p className="text-[15px] text-[var(--muted)]">
                {profile.degree} · Currently in {profile.year_of_study}
              </p>

              <div className="space-y-4 pt-2">
                {profile.semesters.map((sem) => {
                  const pct = Math.min(100, (sem.sgpa / sem.max_scale) * 100);
                  return (
                    <div
                      key={sem.semester}
                      className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-[var(--ink)]">{sem.label}</span>
                        <span className="font-mono-code font-bold text-[var(--accent)]">
                          {sem.sgpa} / {sem.max_scale}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-[var(--surface-alt)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-[var(--muted)]">{sem.focus}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Python GPA Target Forecaster */}
            <div className="lg:col-span-7 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-bold text-[var(--ink)]">
                    Python CGPA Target Forecaster
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Calculated by <code className="font-mono-code">python_app/gpa_analytics.py</code> from completed semesters
                  </p>
                </div>
                <div className="font-mono-code text-sm font-semibold text-[var(--accent)]">
                  Target: {targetCgpa.toFixed(2)} CGPA
                </div>
              </div>

              <label className="block space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>Adjust 8-Semester Graduation Goal</span>
                  <span className="font-mono-code">7.50 — 9.50</span>
                </div>
                <input
                  type="range"
                  min={7.5}
                  max={9.5}
                  step={0.1}
                  value={targetCgpa}
                  onChange={(e) => setTargetCgpa(Number.parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </label>

              {forecast && (
                <div className="space-y-4 pt-2 border-t border-[var(--line)]">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-[var(--muted)]">Current CGPA</div>
                      <div className="font-mono-code text-lg font-bold text-[var(--ink)]">
                        {academics.current_cgpa.toFixed(3)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--muted)]">Required Avg SGPA</div>
                      <div className="font-mono-code text-lg font-bold text-[var(--accent)]">
                        {forecast.required_sgpa_per_semester.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--muted)]">Max Reachable</div>
                      <div className="font-mono-code text-lg font-bold text-[var(--ink)]">
                        {forecast.max_possible_cgpa.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--muted)]">{forecast.summary}</p>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2">
                    {forecast.trajectory.map((pt) => {
                      const heightPct = Math.max(15, Math.min(100, (pt.sgpa / 10) * 100));
                      const isCompleted = pt.kind === 'completed';
                      return (
                        <div key={pt.semester} className="flex flex-col items-center gap-1.5">
                          <span className="font-mono-code text-[11px] text-[var(--ink)]">
                            {pt.sgpa.toFixed(2)}
                          </span>
                          <div className="w-full h-24 rounded-lg bg-[var(--surface-alt)] flex items-end p-1">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full rounded-md transition-all ${
                                isCompleted
                                  ? 'bg-[var(--accent)]'
                                  : 'bg-[var(--accent)]/40 border border-dashed border-[var(--accent)]'
                              }`}
                            />
                          </div>
                          <span className="text-[11px] text-[var(--muted)]">{pt.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Projects + Live Jain Transit Python Router */}
        <section id="projects" className="pt-12 border-t border-[var(--line)] space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                Selected Projects
              </h2>
              <p className="mt-1.5 text-sm text-[var(--muted)]">
                Real-world student web engineering paired with live Python route optimization.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {profile.projects.map((project) => (
              <article
                key={project.id}
                className="flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden"
              >
                <div className="aspect-[16/10] w-full bg-[var(--surface-alt)] overflow-hidden">
                  <ResilientImage
                    src={project.image_path}
                    alt={project.title}
                    fallbackTitle={project.title}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="text-xs text-[var(--muted)]">{project.category}</div>
                    <h3 className="font-display text-xl font-bold text-[var(--ink)]">
                      {project.index_label}
                    </h3>
                    <p className="text-[15px] leading-relaxed text-[var(--muted)]">
                      {project.summary}
                    </p>
                    <p className="text-xs font-medium text-[var(--ink)]">{project.role}</p>
                  </div>

                  {/* Interactive Python Route Finder embedded inside Jain Transit */}
                  {project.id === 'jain-transit' && (
                    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]">
                          <Navigation className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                          <span>Live Python Shuttle Route Solver</span>
                        </span>
                        {transitRoute?.elapsed_microseconds !== undefined && (
                          <span className="font-mono-code text-[11px] text-[var(--muted)]">
                            {transitRoute.elapsed_microseconds} µs
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          aria-label="Origin campus stop"
                          value={transitFrom}
                          onChange={(e) => setTransitFrom(e.target.value)}
                          className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--ink)]"
                        >
                          {transitStops.map((stop) => (
                            <option key={stop} value={stop}>
                              From: {stop}
                            </option>
                          ))}
                        </select>

                        <select
                          aria-label="Destination campus stop"
                          value={transitTo}
                          onChange={(e) => setTransitTo(e.target.value)}
                          className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--ink)]"
                        >
                          {transitStops.map((stop) => (
                            <option key={stop} value={stop}>
                              To: {stop}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={routingBusy}
                          onClick={() => void solveTransit(transitFrom, transitTo)}
                          className="px-3 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white dark:text-[#091518] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                        >
                          {routingBusy ? 'Solving...' : 'Find Route'}
                        </button>
                      </div>

                      {transitRoute?.found && transitRoute.path && (
                        <div className="text-xs space-y-1 pt-1">
                          <div className="font-medium text-[var(--ink)]">
                            {transitRoute.path.join(' → ')}
                          </div>
                          <div className="text-[var(--muted)] font-mono-code">
                            {transitRoute.total_minutes} min total · {transitRoute.stops_count} stops
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--line)]">
                    <span className="text-xs text-[var(--muted)] truncate">
                      {project.stack.join(' · ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedProject(project)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
                    >
                      <span>Project Details</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Section 4: Interactive Python DSA Lab & Codebase Language Breakdown */}
        <section id="python-lab" className="pt-12 border-t border-[var(--line)]">
          <PythonDsaLab
            transitStops={transitStops}
            languageStats={langStats}
            pythonVersion={runtime.version}
          />
        </section>

        {/* Section 5: Certifications & Python SQLite Contact Inquiry */}
        <section id="contact" className="pt-12 border-t border-[var(--line)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
                  <Award className="w-4 h-4" aria-hidden="true" />
                  <span>Certifications</span>
                </div>
                {profile.certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-2"
                  >
                    <h3 className="font-display text-lg font-bold text-[var(--ink)]">
                      {cert.title}
                    </h3>
                    <p className="text-xs font-mono-code text-[var(--accent)]">{cert.period}</p>
                    <ul className="pt-2 space-y-1 text-xs text-[var(--muted)] list-disc pl-4">
                      {cert.focus_topics.map((topic) => (
                        <li key={topic}>{topic}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
                  Contact
                </h2>
                <p className="text-[15px] text-[var(--muted)] leading-relaxed">
                  {profile.availability}. Reach out directly via email or submit the form stored in Python&apos;s SQLite backend.
                </p>
                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:underline underline-offset-4"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span>{profile.email}</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
              <h3 className="font-display text-xl font-bold text-[var(--ink)] mb-1">
                Send an Internship or Role Inquiry
              </h3>
              <p className="text-xs text-[var(--muted)] mb-5">
                Validated and stored via <code className="font-mono-code">python_app/contact_store.py</code> (SQLite3).
              </p>

              <form onSubmit={(e) => void handleInquirySubmit(e)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block text-xs text-[var(--muted)]">
                    Your Name *
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Recruiter or Engineer Name"
                      className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)]"
                    />
                  </label>
                  <label className="block text-xs text-[var(--muted)]">
                    Email Address *
                    <input
                      type="email"
                      required
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block text-xs text-[var(--muted)]">
                    Organization / Team
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Company or University Lab"
                      className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)]"
                    />
                  </label>
                  <label className="block text-xs text-[var(--muted)]">
                    Inquiry Type
                    <select
                      value={inquiryType}
                      onChange={(e) => setInquiryType(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)]"
                    >
                      <option value="Internship">Internship</option>
                      <option value="Entry-Level Role">Entry-Level Role</option>
                      <option value="Project Collaboration">Project Collaboration</option>
                    </select>
                  </label>
                </div>

                <label className="block text-xs text-[var(--muted)]">
                  Message *
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share role details, Python / AI & ML focus, or next steps..."
                    className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)]"
                  />
                </label>

                {inquiryStatus && (
                  <p
                    className={`text-xs font-medium ${
                      inquiryStatus.kind === 'ok'
                        ? 'text-[var(--accent)]'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {inquiryStatus.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white dark:text-[#091518] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  <span>{submittingInquiry ? 'Submitting...' : 'Send Inquiry'}</span>
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] mt-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[var(--muted)]">
          <span>
            Dadiyala Lathish Gokul · {profile.location}
          </span>
          <div className="flex items-center gap-6">
            <a href="#top" className="hover:text-[var(--ink)] transition-colors">
              Back to top
            </a>
            <a href={`mailto:${profile.email}`} className="hover:text-[var(--ink)] transition-colors">
              {profile.email}
            </a>
          </div>
        </div>
      </footer>

      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}
