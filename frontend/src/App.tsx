import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clipboard,
  Container,
  Database,
  ExternalLink,
  HeartPulse,
  Menu,
  Network,
  RefreshCw,
  Server,
  Terminal,
  X
} from "lucide-react";

type Probe = {
  status: "UP" | "DOWN" | "UNKNOWN";
  httpStatus?: number;
  responseTimeMs?: number;
  body?: unknown;
  error?: string;
  checkedAt: string;
};

type HistoryRecord = {
  id: number;
  checkName: string;
  status: string;
  httpStatus: number;
  responseTimeMs: number;
  detail: string;
  checkedAt: string;
};

const commands = [
  ["docker ps -a", "Confirm whether the expected container is running or exited."],
  ["docker inspect java-health-monitor-app", "Read state, health history, ports, and network attachment."],
  ["docker logs --tail=100 java-health-monitor-app", "Find Spring startup exceptions and binding errors."],
  ["docker port java-health-monitor-app", "Verify that host port 8080 is published to container port 8080."],
  ["docker network inspect java-health-monitor", "Check service membership and container IP addresses."],
  ["docker compose ps", "View the Compose service state and health summary."],
  ["docker compose logs --tail=100 app", "Read application logs by Compose service name."]
];

const scenarios = [
  ["Healthy application", "Run the normal Compose file and wait for (healthy).", "Verify /api/status and /actuator/health return 200.", "Healthy"],
  ["Incorrect health path", "Use compose.failure.yaml to point the probe at a typo.", "The process can be running while Docker reports unhealthy and health history shows 404.", "Configuration"],
  ["Wrong port mapping", "Publish a different host port in a local override.", "docker port reveals the mismatch; restore 8080:8080.", "Networking"],
  ["PostgreSQL unavailable", "Stop the postgres service without deleting its volume.", "The database diagnostic returns 503; restart postgres and verify recovery.", "Database"]
];

/* ===================== BACKGROUND ELEMENTS ===================== */
const CODE_GLYPHS = [
  "{ }",
  "</>",
  "() =>",
  "const x",
  "import",
  "async",
  "return;",
  "catch(e)",
  "while(1)",
  "npm run",
  "git push",
  "docker ps",
];

function BackgroundEffects() {
  return (
    <>
      {/* Shooting stars */}
      <div className="bg-stars" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="star" />
        ))}
      </div>

      {/* Floating code glyphs */}
      <div className="bg-code" aria-hidden="true">
        {CODE_GLYPHS.map((g, i) => (
          <span key={i} className="code-glyph">{g}</span>
        ))}
      </div>
    </>
  );
}

async function probe(url: string): Promise<Probe> {
  const started = performance.now();
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const bodyText = await response.text();
    let body: unknown;
    let responseIsJson = true;
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      responseIsJson = false;
      body = {
        error: `Endpoint returned non-JSON content (${response.headers.get("content-type") ?? "unknown content type"})`,
        preview: bodyText.slice(0, 160)
      };
    }
    return {
      status: response.ok && responseIsJson ? "UP" : "DOWN",
      httpStatus: response.status,
      responseTimeMs: Math.round(performance.now() - started),
      body,
      checkedAt
    };
  } catch (error) {
    return {
      status: "UNKNOWN",
      responseTimeMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : "Request failed",
      checkedAt
    };
  }
}

type Page = "dashboard" | "health" | "diagnostics" | "lab";

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [api, setApi] = useState<Probe>();
  const [actuator, setActuator] = useState<Probe>();
  const [database, setDatabase] = useState<Probe>();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageKey, setPageKey] = useState(0);

  const handleSetPage = (p: Page) => {
    setPage(p);
    setPageKey(k => k + 1);
    setMenuOpen(false);
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    const [apiResult, actuatorResult, databaseResult] = await Promise.all([
      probe("/api/status"),
      probe("/actuator/health"),
      probe("/api/diagnostics/database")
    ]);
    setApi(apiResult);
    setActuator(actuatorResult);
    setDatabase(databaseResult);
    try {
      const response = await fetch("/api/health-history");
      if (response.ok) setHistory(await response.json());
    } catch {
      // Individual probe cards already show unavailable state.
    }
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const overall = useMemo(() => {
    if (!api || !actuator) return "CHECKING";
    if (api.status === "UP" && actuator.status === "UP" && database?.status === "UP") return "OPERATIONAL";
    return "DEGRADED";
  }, [api, actuator, database]);

  return (
    <div className="app-shell">
      <BackgroundEffects />
      {/* Mobile overlay */}
      {menuOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(2,8,23,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div className="brand-mark"><HeartPulse size={20} /></div>
          <div>
            <strong>Java Health</strong>
            <span>MONITORING SYSTEM</span>
          </div>
          <button className="icon-button mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={17} /></button>
        </div>

        <nav>
          <NavItem icon={<Activity size={17} />} label="Overview" active={page === "dashboard"} onClick={() => handleSetPage("dashboard")} />
          <NavItem icon={<HeartPulse size={17} />} label="Health checks" active={page === "health"} onClick={() => handleSetPage("health")} />
          <NavItem icon={<Terminal size={17} />} label="Diagnostics" active={page === "diagnostics"} onClick={() => handleSetPage("diagnostics")} />
          <NavItem icon={<AlertTriangle size={17} />} label="Failure lab" active={page === "lab"} onClick={() => handleSetPage("lab")} />
        </nav>

        <div className="sidebar-footer">
          <span className="live-dot" />Local environment<br />
          <small>Docker Desktop / Compose</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={19} /></button>
          <div>
            <p className="eyebrow">ASSIGNMENT Q54</p>
            <h1>{pageTitle(page)}</h1>
          </div>
          <button className="refresh-button" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            {loading ? "Checking…" : "Run checks"}
          </button>
        </header>

        {/* key prop forces re-mount → re-triggers CSS page entry animation */}
        {page === "dashboard" && <Dashboard key={`dashboard-${pageKey}`} api={api} actuator={actuator} database={database} overall={overall} history={history} onNavigate={handleSetPage} />}
        {page === "health"    && <HealthPage key={`health-${pageKey}`} api={api} actuator={actuator} onRefresh={() => void refresh()} />}
        {page === "diagnostics" && <Diagnostics key={`diag-${pageKey}`} />}
        {page === "lab"       && <FailureLab key={`lab-${pageKey}`} />}
      </main>
    </div>
  );
}

/* ===================== NAV ITEM ===================== */
function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={active ? "nav-item active" : "nav-item"} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {active && <ArrowUpRight size={13} />}
    </button>
  );
}

/* ===================== DASHBOARD ===================== */
function Dashboard({
  api, actuator, database, overall, history, onNavigate
}: {
  api?: Probe; actuator?: Probe; database?: Probe; overall: string;
  history: HistoryRecord[]; onNavigate: (page: "health" | "diagnostics") => void;
}) {
  return (
    <section className="content">
      {/* Hero */}
      <div className="hero-card">
        <div>
          <div className="status-line">
            <span className={overall === "OPERATIONAL" ? "status-dot up" : "status-dot warn"} />
            System {overall.toLowerCase()}
          </div>
          <h2>Know when your Java API is truly available.</h2>
          <p>Live probes separate container state from application readiness, Docker health, and database connectivity.</p>
        </div>
        <div className="hero-graphic">
          <div className="pulse-ring"><HeartPulse size={36} /></div>
          <span>LIVE</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="section-heading">
        <div>
          <p className="eyebrow">LIVE SIGNALS</p>
          <h3>Service availability</h3>
        </div>
        <span className="updated">Browser probes • {new Date().toLocaleTimeString()}</span>
      </div>

      <div className="metrics-grid">
        <MetricCard
          icon={<Server size={17} />} label="Java API"
          value={api?.status ?? "CHECKING"}
          detail={api?.httpStatus ? `HTTP ${api.httpStatus} · ${api.responseTimeMs} ms` : api?.error ?? "Waiting for probe"}
          status={api?.status === "UP" ? "up" : "warn"}
        />
        <MetricCard
          icon={<Container size={17} />} label="Docker health"
          value="SEE CLI" detail="Browser cannot safely read Docker daemon state"
          status="neutral"
        />
        <MetricCard
          icon={<HeartPulse size={17} />} label="Actuator readiness"
          value={actuator?.status ?? "CHECKING"}
          detail={actuator?.httpStatus ? `HTTP ${actuator.httpStatus} · ${actuator.responseTimeMs} ms` : actuator?.error ?? "Waiting for probe"}
          status={actuator?.status === "UP" ? "up" : "warn"}
        />
        <MetricCard
          icon={<Database size={17} />} label="PostgreSQL"
          value={database?.status ?? "CHECKING"}
          detail={database?.body && typeof database.body === "object" && "message" in database.body ? String((database.body as Record<string, unknown>).message) : database?.error ?? "Waiting for probe"}
          status={database?.status === "UP" ? "up" : "warn"}
        />
      </div>

      {/* Two-column */}
      <div className="two-column">
        <div className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">RECENT ACTIVITY</p>
              <h3>Real recorded checks</h3>
            </div>
            <button className="text-button" onClick={() => onNavigate("health")}>
              View checks <ArrowUpRight size={14} />
            </button>
          </div>
          {history.length === 0
            ? <EmptyState text="Run a check to create persisted history." />
            : (
              <div className="history-list">
                {history.slice(0, 6).map((item, i) => (
                  <div className="history-row" key={item.id} style={{ animationDelay: `${i * 0.05}s` }}>
                    <span className={item.status === "UP" ? "status-dot up" : "status-dot down"} />
                    <div>
                      <strong>{item.checkName}</strong>
                      <small>{item.detail}</small>
                    </div>
                    <time>{new Date(item.checkedAt).toLocaleTimeString()}</time>
                    <b className={item.status === "UP" ? "text-up" : "text-down"}>{item.status}</b>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        <div className="panel insight-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">DIAGNOSTIC SUMMARY</p>
              <h3>What to inspect next</h3>
            </div>
            <Terminal size={18} className="muted-icon" />
          </div>
          <Insight icon={<CheckCircle2 size={17} />} title="Application probes are live" text="The website uses real HTTP responses. Docker state is intentionally not fabricated." />
          <Insight icon={<Network size={17} />} title="Check the host path" text="If the browser fails, verify docker port and the server bind address." />
          <Insight icon={<AlertTriangle size={17} />} title="Running is not healthy" text="Use docker inspect to read the HEALTHCHECK history and failing command." />
        </div>
      </div>
    </section>
  );
}

/* ===================== METRIC CARD ===================== */
function MetricCard({ icon, label, value, detail, status }: { icon: React.ReactNode; label: string; value: string; detail: string; status: string }) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className="metric-icon">{icon}</span>
        <span className={status === "up" ? "status-pill up" : status === "warn" ? "status-pill warn" : "status-pill"}>
          {status === "up" ? "Healthy" : status === "warn" ? "Attention" : "Manual"}
        </span>
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

/* ===================== INSIGHT ===================== */
function Insight({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="insight">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

/* ===================== HEALTH PAGE ===================== */
function HealthPage({ api, actuator, onRefresh }: { api?: Probe; actuator?: Probe; onRefresh: () => void }) {
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <p className="eyebrow">HTTP PROBES</p>
          <h2>Health check center</h2>
          <p>These are live requests from your browser to the Spring Boot service. Response times and bodies are not simulated.</p>
        </div>
        <button className="refresh-button" onClick={onRefresh}><RefreshCw size={15} /> Check now</button>
      </div>
      <div className="probe-grid">
        <ProbeCard title="GET /api/status" probe={api} />
        <ProbeCard title="GET /actuator/health" probe={actuator} />
      </div>
      <div className="panel explanation">
        <p className="eyebrow">IMPORTANT DISTINCTION</p>
        <h3>Application health vs Docker health</h3>
        <p>Actuator reports what Spring Boot knows about the application. Docker's HEALTHCHECK reports whether a command inside the container can reach that endpoint. A container may be running while this request fails; use the Diagnostics page for the read-only Docker commands that prove the difference.</p>
      </div>
    </section>
  );
}

/* ===================== PROBE CARD ===================== */
function ProbeCard({ title, probe }: { title: string; probe?: Probe }) {
  return (
    <div className="panel probe-card">
      <div className="panel-title">
        <h3>{title}</h3>
        <span className={probe?.status === "UP" ? "status-pill up" : "status-pill warn"}>{probe?.status ?? "CHECKING"}</span>
      </div>
      <div className="probe-meta">
        <span>HTTP {probe?.httpStatus ?? "—"}</span>
        <span>{probe?.responseTimeMs ?? "—"} ms</span>
        <span>{probe ? new Date(probe.checkedAt).toLocaleTimeString() : "Not checked"}</span>
      </div>
      <pre>{JSON.stringify(probe?.body ?? { error: probe?.error ?? "Waiting for response" }, null, 2)}</pre>
    </div>
  );
}

/* ===================== DIAGNOSTICS ===================== */
function Diagnostics() {
  const [copied, setCopied] = useState<string>();
  const copy = async (command: string) => {
    await navigator.clipboard.writeText(command);
    setCopied(command);
    setTimeout(() => setCopied(undefined), 1500);
  };

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <p className="eyebrow">READ-ONLY INVESTIGATION</p>
          <h2>Container diagnostics</h2>
          <p>Use these explicit commands in PowerShell. This site never accepts arbitrary shell input or claims Docker state it cannot observe.</p>
        </div>
        <Terminal className="page-icon" size={36} />
      </div>

      <div className="command-list">
        {commands.map(([command, purpose]) => (
          <div className="command-row" key={command}>
            <code>{command}</code>
            <span>{purpose}</span>
            <button className="copy-button" onClick={() => void copy(command)}>
              {copied === command ? <CheckCircle2 size={15} /> : <Clipboard size={15} />}
            </button>
          </div>
        ))}
      </div>

      <div className="two-column">
        <div className="panel">
          <p className="eyebrow">PORT CHECK</p>
          <h3>Expected mapping</h3>
          <p style={{ color: "#7da5be", fontSize: 13, lineHeight: 1.75, marginTop: 12 }}>
            Compose should publish <code>8080:8080</code>. <code>EXPOSE 8080</code> alone is only metadata.
            If the host request fails, compare the browser URL with <code>docker port</code>.
          </p>
        </div>
        <div className="panel">
          <p className="eyebrow">NETWORK CHECK</p>
          <h3>Service DNS</h3>
          <p style={{ color: "#7da5be", fontSize: 13, lineHeight: 1.75, marginTop: 12 }}>
            Inside the Compose network, the application reaches PostgreSQL using the service name <code>postgres</code>, never <code>localhost</code>.
            Localhost inside a container means that same container.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ===================== FAILURE LAB ===================== */
function FailureLab() {
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <p className="eyebrow">CONTROLLED SCENARIOS</p>
          <h2>Failure simulation lab</h2>
          <p>Reproducible configuration changes demonstrate real symptoms without exposing destructive controls in the website.</p>
        </div>
        <AlertTriangle className="page-icon warning-icon" size={36} />
      </div>

      <div className="scenario-grid">
        {scenarios.map(([title, procedure, symptom, type]) => (
          <div className="panel scenario" key={title}>
            <div className="scenario-label">{type}</div>
            <h3>{title}</h3>
            <p><strong>Reproduce:</strong> {procedure}</p>
            <p><strong>Observe:</strong> {symptom}</p>
            <div className="scenario-footer">
              <span>Documented procedure</span>
              <ExternalLink size={14} />
            </div>
          </div>
        ))}
      </div>

      <div className="recovery-banner">
        <CheckCircle2 size={22} />
        <div>
          <strong>Recovery pattern</strong>
          <p>Correct the configuration, run <code>docker compose up -d --build</code>, wait through the startup period, then verify both HTTP probes and Docker's reported health.</p>
        </div>
      </div>
    </section>
  );
}

/* ===================== UTILS ===================== */
function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <Activity size={18} />
      <span>{text}</span>
    </div>
  );
}

function pageTitle(page: string) {
  return page === "dashboard" ? "System overview"
    : page === "health" ? "Health checks"
    : page === "diagnostics" ? "Container diagnostics"
    : "Failure simulation lab";
}

export default App;
