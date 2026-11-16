import { useEffect, useState } from 'react';
import { Play, Terminal } from 'lucide-react';
import type {
  DsaAlgorithmMeta,
  DsaRunResult,
  LanguageStatsResponse,
} from '../types/portfolio';

interface PythonDsaLabProps {
  transitStops: string[];
  languageStats: LanguageStatsResponse | null;
  pythonVersion: string;
}

export function PythonDsaLab({
  transitStops,
  languageStats,
  pythonVersion,
}: PythonDsaLabProps) {
  const [algorithms, setAlgorithms] = useState<DsaAlgorithmMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string>('bus_bfs');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DsaRunResult | null>(null);

  // Editable parameter state per algorithm
  const [bfsStart, setBfsStart] = useState('Main Gate');
  const [bfsDest, setBfsDest] = useState('AI & ML Lab');
  const [arrayText, setArrayText] = useState('4, 11, 18, 23, 35, 42, 58');
  const [targetNum, setTargetNum] = useState('23');
  const [twoSumArray, setTwoSumArray] = useState('2, 7, 11, 15, 21');
  const [twoSumTarget, setTwoSumTarget] = useState('18');
  const [lcsA, setLcsA] = useState('JAIN_PYTHON_AIML');
  const [lcsB, setLcsB] = useState('PYTHON_TRANSIT_AI');

  useEffect(() => {
    let active = true;
    fetch('/api/py/dsa')
      .then((res) => res.json())
      .then((data: { algorithms?: DsaAlgorithmMeta[] }) => {
        if (!active || !data.algorithms) return;
        setAlgorithms(data.algorithms);
      })
      .catch(() => {
        if (active) setError('Unable to load Python DSA modules.');
      });
    return () => {
      active = false;
    };
  }, []);

  const currentAlgo = algorithms.find((a) => a.id === selectedId) ?? algorithms[0];

  const executeAlgorithm = async (algoId: string) => {
    setRunning(true);
    setError(null);

    let inputs: Record<string, unknown> = {};
    if (algoId === 'bus_bfs') {
      inputs = { start: bfsStart, destination: bfsDest };
    } else if (algoId === 'binary_search') {
      const nums = arrayText
        .split(',')
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n));
      inputs = { nums, target: Number.parseInt(targetNum, 10) || 0 };
    } else if (algoId === 'two_sum') {
      const nums = twoSumArray
        .split(',')
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n));
      inputs = { nums, target: Number.parseInt(twoSumTarget, 10) || 0 };
    } else {
      inputs = { text_a: lcsA, text_b: lcsB };
    }

    try {
      const res = await fetch('/api/py/dsa/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm_id: algoId, inputs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Execution failed');
      } else {
        setResult(data as DsaRunResult);
      }
    } catch {
      setError('Failed to reach Python runtime.');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (algorithms.length > 0) {
      void executeAlgorithm(selectedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, algorithms.length]);

  const stops = transitStops.length
    ? transitStops
    : ['Main Gate', 'Transit Terminal', 'Central Library', 'Academic Block A', 'AI & ML Lab'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--accent)] mb-1">
            Python {pythonVersion} Runtime · Live AST &amp; Execution Lab
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
            Interactive Python DSA Sandbox
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] max-w-2xl">
            Every algorithm below executes directly inside the Python 3 backend, returning live
            step traces, AST metrics, and microsecond timing.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)]">
          {algorithms.map((algo) => {
            const active = algo.id === selectedId;
            return (
              <button
                key={algo.id}
                type="button"
                onClick={() => setSelectedId(algo.id)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                  active
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {algo.title}
              </button>
            );
          })}
        </div>
      </div>

      {currentAlgo && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Source Code & AST Panel */}
          <div className="lg:col-span-7 flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-[var(--line)]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                <Terminal className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                <span>{currentAlgo.title}</span>
              </div>
              <div className="text-xs text-[var(--muted)] font-mono-code">
                {currentAlgo.complexity_time} time · {currentAlgo.complexity_space} space
              </div>
            </div>

            <div className="px-5 py-3 text-sm text-[var(--muted)] border-b border-[var(--line)]">
              {currentAlgo.description}
            </div>

            <pre className="flex-1 p-5 overflow-x-auto bg-[var(--code-bg)] text-[var(--code-ink)] text-xs leading-relaxed font-mono-code">
              <code>{currentAlgo.source_code}</code>
            </pre>

            <div className="grid grid-cols-4 divide-x divide-[var(--line)] border-t border-[var(--line)] text-center py-3 bg-[var(--surface)]">
              <div>
                <div className="font-mono-code text-sm font-semibold text-[var(--ink)]">
                  {currentAlgo.ast_summary.source_lines}
                </div>
                <div className="text-[11px] text-[var(--muted)]">Lines</div>
              </div>
              <div>
                <div className="font-mono-code text-sm font-semibold text-[var(--ink)]">
                  {currentAlgo.ast_summary.ast_nodes}
                </div>
                <div className="text-[11px] text-[var(--muted)]">AST Nodes</div>
              </div>
              <div>
                <div className="font-mono-code text-sm font-semibold text-[var(--ink)]">
                  {currentAlgo.ast_summary.loops}
                </div>
                <div className="text-[11px] text-[var(--muted)]">Loops</div>
              </div>
              <div>
                <div className="font-mono-code text-sm font-semibold text-[var(--ink)]">
                  {currentAlgo.ast_summary.branches}
                </div>
                <div className="text-[11px] text-[var(--muted)]">Branches</div>
              </div>
            </div>
          </div>

          {/* Interactive Inputs & Execution Output */}
          <div className="lg:col-span-5 flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">
                Custom Parameters
              </h3>

              {selectedId === 'bus_bfs' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-xs text-[var(--muted)]">
                    Origin Stop
                    <select
                      value={bfsStart}
                      onChange={(e) => setBfsStart(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                    >
                      {stops.map((stop) => (
                        <option key={stop} value={stop}>
                          {stop}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs text-[var(--muted)]">
                    Destination Stop
                    <select
                      value={bfsDest}
                      onChange={(e) => setBfsDest(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                    >
                      {stops.map((stop) => (
                        <option key={stop} value={stop}>
                          {stop}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {selectedId === 'binary_search' && (
                <div className="space-y-3">
                  <label className="block text-xs text-[var(--muted)]">
                    Integer Array (comma-separated)
                    <input
                      type="text"
                      value={arrayText}
                      onChange={(e) => setArrayText(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm font-mono-code text-[var(--ink)]"
                    />
                  </label>
                  <label className="block text-xs text-[var(--muted)]">
                    Target Integer
                    <input
                      type="number"
                      value={targetNum}
                      onChange={(e) => setTargetNum(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm font-mono-code text-[var(--ink)]"
                    />
                  </label>
                </div>
              )}

              {selectedId === 'two_sum' && (
                <div className="space-y-3">
                  <label className="block text-xs text-[var(--muted)]">
                    Numbers List
                    <input
                      type="text"
                      value={twoSumArray}
                      onChange={(e) => setTwoSumArray(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm font-mono-code text-[var(--ink)]"
                    />
                  </label>
                  <label className="block text-xs text-[var(--muted)]">
                    Target Sum
                    <input
                      type="number"
                      value={twoSumTarget}
                      onChange={(e) => setTwoSumTarget(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm font-mono-code text-[var(--ink)]"
                    />
                  </label>
                </div>
              )}

              {selectedId === 'lcs_dp' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-xs text-[var(--muted)]">
                    Sequence A
                    <input
                      type="text"
                      value={lcsA}
                      onChange={(e) => setLcsA(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm font-mono-code text-[var(--ink)]"
                    />
                  </label>
                  <label className="block text-xs text-[var(--muted)]">
                    Sequence B
                    <input
                      type="text"
                      value={lcsB}
                      onChange={(e) => setLcsB(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm font-mono-code text-[var(--ink)]"
                    />
                  </label>
                </div>
              )}

              <button
                type="button"
                disabled={running}
                onClick={() => void executeAlgorithm(selectedId)}
                className="mt-4 inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white dark:text-[#091518] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                <span>{running ? 'Running in Python...' : 'Run in Python'}</span>
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            {result && (
              <div className="flex-1 flex flex-col space-y-3 pt-4 border-t border-[var(--line)]">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span className="font-semibold text-[var(--ink)]">Python Output</span>
                  <span className="font-mono-code">
                    {result.elapsed_microseconds.toFixed(1)} µs
                  </span>
                </div>

                <pre className="p-3.5 rounded-xl bg-[var(--surface-alt)] text-[var(--ink)] text-xs font-mono-code overflow-x-auto">
                  {JSON.stringify(result.output, null, 2)}
                </pre>

                <div>
                  <div className="text-xs font-semibold text-[var(--ink)] mb-1.5">
                    Execution Trace
                  </div>
                  <ol className="space-y-1 text-xs font-mono-code text-[var(--muted)] max-h-44 overflow-y-auto pr-1">
                    {result.trace.map((line, i) => (
                      <li key={`${i}-${line}`} className="leading-relaxed">
                        {i + 1}. {line}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Repository Language Composition */}
      {languageStats && (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-[var(--ink)]">
                Codebase Language Composition
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Measured live by Python&apos;s workspace scanner across source files
              </p>
            </div>
            <div className="font-mono-code text-sm font-semibold text-[var(--accent)]">
              Python {languageStats.python_percentage}% · {(languageStats.total_bytes / 1024).toFixed(1)} KB total
            </div>
          </div>

          <div className="h-3 w-full rounded-full overflow-hidden flex bg-[var(--surface-alt)] mb-4">
            {languageStats.languages.map((lang) => {
              const colorMap: Record<string, string> = {
                Python: 'bg-[var(--accent)]',
                TypeScript: 'bg-slate-600 dark:bg-slate-400',
                CSS: 'bg-amber-600 dark:bg-amber-400',
                HTML: 'bg-stone-500 dark:bg-stone-400',
              };
              return (
                <div
                  key={lang.language}
                  style={{ width: `${lang.percentage}%` }}
                  className={colorMap[lang.language] || 'bg-slate-500'}
                  title={`${lang.language}: ${lang.percentage}%`}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {languageStats.languages.map((lang) => (
              <div key={lang.language} className="text-xs">
                <div className="font-semibold text-[var(--ink)]">
                  {lang.language} · <span className="font-mono-code">{lang.percentage}%</span>
                </div>
                <div className="text-[var(--muted)] font-mono-code mt-0.5">
                  {lang.files} files · {lang.lines} lines
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
