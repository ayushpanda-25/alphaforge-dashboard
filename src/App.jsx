import { useState, useEffect, useCallback } from "react";
import "./App.css";

/* ── Design tokens (matching ayushpanda.vercel.app) ── */
const T = {
  bg: "#0a0a0a",
  panel: "#111111",
  panelAlt: "#1a1a1a",
  card: "#0d0d0d",
  border: "#2a2a2a",
  text: "#e0e0e0",
  dim: "#707070",
  amber: "#ff9500",
  amberDim: "#cc7700",
  green: "#00d26a",
  red: "#ff3b3b",
  blue: "#3b82f6",
};

const SECTOR_COLORS = {
  Energy: "#f97316", Communication: "#a855f7", Semiconductors: "#22d3ee",
  Healthcare: "#00d26a", Financials: "#3b82f6", Industrials: "#eab308",
  Technology: "#818cf8", "Consumer Discretionary": "#ec4899",
  "Consumer Staples": "#14b8a6", Cash: "#707070", Commodities: "#f59e0b",
};

const scoreColor = (s) => {
  if (s >= 70) return T.green;
  if (s >= 55) return "#4ade80";
  if (s >= 42) return "#eab308";
  return T.red;
};

/* ── Reusable Panel ── */
const Panel = ({ title, tag, tagColor, children, style }) => (
  <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden", ...style }}>
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 12px", background: T.panelAlt, borderBottom: `1px solid ${T.border}`,
    }}>
      <span style={{ color: T.amber, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em" }}>{title}</span>
      {tag && (
        <span style={{
          fontSize: 10, padding: "3px 8px", borderRadius: 2,
          color: tagColor || T.amber, background: `${tagColor || T.amber}26`,
        }}>{tag}</span>
      )}
    </div>
    <div style={{ padding: "12px" }}>{children}</div>
  </div>
);

/* ── Stat Card ── */
const StatCard = ({ label, value, color, sub }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 4,
    padding: "16px 12px", textAlign: "center",
  }}>
    <div style={{ fontSize: 11, color: T.dim, marginBottom: 6, letterSpacing: "0.03em" }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: color || T.text, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.dim, marginTop: 6 }}>{sub}</div>}
  </div>
);

/* ── Submission order (matches competition form) ── */
const SUBMISSION_ORDER = [
  "NFLX", "CVX", "MU", "COIN", "COP", "UBER",
  "PLTR", "MA", "GE", "GLD", "GOOGL", "META",
  "MS", "HOOD",
];

/* ── Deployment mode detection ── */
const IS_LOCAL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";

/* ── Main ── */
export default function App() {
  const [portfolio, setPortfolio] = useState(null);
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [engineRunning, setEngineRunning] = useState(false);
  const [engineOutput, setEngineOutput] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchData = useCallback(async () => {
    const loadStatic = async () => {
      const [portRes, flowRes] = await Promise.all([
        fetch("/data/portfolio.json"), fetch("/data/flow.json"),
      ]);
      if (portRes.ok) setPortfolio(await portRes.json());
      if (flowRes.ok) setFlow(await flowRes.json());
    };
    try {
      if (IS_LOCAL) {
        // Local dev: try Flask API first, fall back to static JSON
        try {
          const [portRes, flowRes] = await Promise.all([
            fetch("/api/portfolio"), fetch("/api/flow"),
          ]);
          const portText = await portRes.text();
          if (portText.startsWith("{")) {
            setPortfolio(JSON.parse(portText));
            const flowText = await flowRes.text();
            if (flowText.startsWith("{")) setFlow(JSON.parse(flowText));
          } else {
            await loadStatic();
          }
        } catch {
          await loadStatic();
        }
      } else {
        await loadStatic();
      }
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runEngine = async (full = false) => {
    if (!IS_LOCAL) {
      setEngineOutput({ success: false, error: "Engine runs are only available locally. Use the CLI." });
      return;
    }
    setEngineRunning(true);
    setEngineOutput(null);
    try {
      const res = await fetch(full ? "/api/engine/run-full" : "/api/engine/run", { method: "POST" });
      const data = await res.json();
      setEngineOutput(data);
      if (data.success) await fetchData();
    } catch (e) {
      setEngineOutput({ success: false, error: e.message });
    } finally {
      setEngineRunning(false);
    }
  };

  /* Loading state */
  if (loading) {
    return (
      <div style={{ background: T.bg, color: T.text, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: T.amber, marginBottom: 8 }}>AYUSH PANDA</div>
          <div style={{ color: T.dim, fontSize: 12 }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  /* No data state */
  if (!portfolio || portfolio.error) {
    return (
      <div style={{ background: T.bg, color: T.text, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: T.amber, marginBottom: 8 }}>AYUSH PANDA</div>
          <div style={{ color: T.dim, fontSize: 12, marginBottom: 16 }}>No portfolio data. Run the engine to generate.</div>
          <button
            onClick={() => runEngine(false)}
            disabled={engineRunning}
            style={{
              background: "transparent", color: T.amber, border: `1px solid ${T.amber}`,
              padding: "8px 20px", borderRadius: 2, fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {engineRunning ? "Running..." : "Run Engine"}
          </button>
        </div>
      </div>
    );
  }

  const equities = portfolio.portfolio.filter((h) => h.type === "equity");
  const avgScore = equities.reduce((s, h) => s + h.quality_score, 0) / equities.length;

  /* Sector data */
  const sectorMap = {};
  portfolio.portfolio.forEach((h) => { sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.weight_pct; });
  const sectorData = Object.entries(sectorMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const regimeLabel = portfolio.market_regime;
  const regimeColor = regimeLabel === "LOW_VOL" ? T.green : regimeLabel === "NORMAL" ? T.blue : regimeLabel === "HIGH_VOL" ? "#eab308" : T.red;

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: "100vh" }}>
      {/* ── Header Bar ── */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 24px", background: T.panel, borderBottom: `1px solid ${T.border}`, fontSize: 12,
      }}>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <span style={{ color: T.amber, fontWeight: 700, letterSpacing: "0.1em" }}>ASTRAIOS</span>
          <span style={{ color: T.border, margin: "0 4px" }}>|</span>
          <span style={{ color: T.amber }}>ALPHAFORGE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => runEngine(false)}
            disabled={engineRunning}
            style={{
              background: "transparent", color: engineRunning ? T.dim : T.amber,
              border: `1px solid ${engineRunning ? T.border : T.amber}`,
              padding: "4px 12px", borderRadius: 2, fontSize: 11, cursor: "pointer",
              fontFamily: "inherit", fontWeight: 600,
            }}
          >
            {engineRunning ? "Running..." : "Run Engine"}
          </button>
          <button
            onClick={() => runEngine(true)}
            disabled={engineRunning}
            style={{
              background: engineRunning ? "transparent" : `${T.amber}26`,
              color: engineRunning ? T.dim : T.amber,
              border: `1px solid ${engineRunning ? T.border : T.amber}`,
              padding: "4px 12px", borderRadius: 2, fontSize: 11, cursor: "pointer",
              fontFamily: "inherit", fontWeight: 600,
            }}
          >
            {engineRunning ? "Running..." : "Full + LSEG"}
          </button>
        </div>
      </nav>

      {/* ── Page Header ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        padding: "24px 24px 16px",
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: T.amber, margin: 0 }}>AYUSH PANDA</h1>
          <div style={{ color: T.dim, fontSize: 12, marginTop: 4 }}>
            Astraios · VLM v8.2 · 7-Factor Portfolio Construction
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, marginBottom: 2 }}>
            <span style={{ color: T.dim }}>POSITIONS: </span>
            <span style={{ color: T.amber, fontWeight: 500 }}>{portfolio.total_holdings}</span>
          </div>
          <div style={{ fontSize: 12, marginBottom: 2 }}>
            <span style={{ color: T.dim }}>REGIME: </span>
            <span style={{ color: regimeColor, fontWeight: 500 }}>{regimeLabel}</span>
          </div>
          <div style={{ fontSize: 12, marginBottom: 2 }}>
            <span style={{ color: T.dim }}>QUALITY: </span>
            <span style={{ color: scoreColor(avgScore), fontWeight: 500 }}>{avgScore.toFixed(1)}</span>
          </div>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: T.dim }}>STATUS: </span>
            <span style={{ color: T.green, fontWeight: 500 }}>ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Engine toast */}
      {engineOutput && (
        <div style={{
          margin: "0 24px 12px", padding: "8px 12px", borderRadius: 2,
          background: engineOutput.success ? `${T.green}15` : `${T.red}15`,
          border: `1px solid ${engineOutput.success ? T.green : T.red}40`,
          display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12,
        }}>
          <span style={{ color: engineOutput.success ? T.green : T.red }}>
            {engineOutput.success ? "Engine completed. Portfolio updated." : `Engine failed: ${engineOutput.error}`}
          </span>
          <button onClick={() => setEngineOutput(null)} style={{ background: "none", border: "none", color: T.dim, cursor: "pointer" }}>x</button>
        </div>
      )}

      {/* ── Main Content ── */}
      <div style={{ padding: "0 24px 24px", maxWidth: 1280, margin: "0 auto" }}>

        {/* Summary Stats */}
        <Panel title="PORTFOLIO SUMMARY" tag={`${portfolio.equity_holdings} EQUITIES + ${typeof portfolio.defensive_anchors === "number" ? portfolio.defensive_anchors : portfolio.defensive_anchors?.length || 0} ANCHORS`} style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <StatCard
              label="AVG QUALITY SCORE"
              value={avgScore.toFixed(1)}
              color={scoreColor(avgScore)}
              sub={avgScore >= 65 ? "Strong" : avgScore >= 55 ? "Good" : "Moderate"}
            />
            <StatCard
              label="TOP SCORE"
              value={equities[0]?.quality_score.toFixed(1)}
              color={T.green}
              sub={equities[0]?.ticker}
            />
            <StatCard
              label="VIX LEVEL"
              value={portfolio.vix}
              color={regimeColor}
              sub={regimeLabel}
            />
            <StatCard
              label="REGIME TILT"
              value={portfolio.regime_tilt?.split("/")[0] || "N/A"}
              color={T.amber}
              sub={portfolio.regime_tilt?.includes("quality") ? "Quality weighted" : "Balanced"}
            />
          </div>
        </Panel>

        {/* Holdings Table */}
        <Panel title="PORTFOLIO HOLDINGS" tag={`${portfolio.total_holdings} POSITIONS`} style={{ marginBottom: 16 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["#", "TICKER", "WT%", "SCORE", "TECH", "FLOW", "VOL", "NEWS", "RGM", "ADX", "MOM", "SECTOR", "PRICE"].map((h) => (
                    <th key={h} style={{
                      padding: "6px 8px", textAlign: h === "TICKER" || h === "SECTOR" ? "left" : "right",
                      color: T.dim, fontWeight: 500, fontSize: 10, letterSpacing: "0.05em",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...portfolio.portfolio].sort((a, b) => {
                  const ai = SUBMISSION_ORDER.indexOf(a.ticker);
                  const bi = SUBMISSION_ORDER.indexOf(b.ticker);
                  return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
                }).map((h) => {
                  const isAnchor = h.type === "anchor";
                  const isExpanded = expandedRow === h.ticker;
                  return (
                    <tr
                      key={h.ticker}
                      onClick={() => setExpandedRow(isExpanded ? null : h.ticker)}
                      className="holding-row"
                      style={{
                        borderBottom: `1px solid ${T.border}40`,
                        cursor: "pointer",
                        background: isExpanded ? `${T.amber}10` : "transparent",
                      }}
                    >
                      <td style={{ padding: "8px", textAlign: "right", color: T.dim, fontSize: 11 }}>{h.rank}</td>
                      <td style={{ padding: "8px", fontWeight: 600 }}>
                        {h.ticker}
                        {isAnchor && <span style={{ fontSize: 9, color: T.amber, marginLeft: 6, fontWeight: 600, letterSpacing: "0.05em" }}>ANCHOR</span>}
                      </td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        <span style={{
                          padding: "2px 6px", borderRadius: 2, fontSize: 11, fontWeight: 600,
                          background: `${T.amber}20`, color: T.amber,
                        }}>{h.weight_pct}%</span>
                      </td>
                      <td style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: scoreColor(h.quality_score) }}>
                        {h.quality_score.toFixed(1)}
                      </td>
                      <td style={numCell}>{h.technical_score.toFixed(1)}</td>
                      <td style={numCell}>{h.flow_score.toFixed(1)}</td>
                      <td style={numCell}>{(h.volume_score ?? 0).toFixed(1)}</td>
                      <td style={numCell}>{(h.news_score ?? 0).toFixed(1)}</td>
                      <td style={numCell}>{h.regime_score.toFixed(1)}</td>
                      <td style={numCell}>{h.adx_score.toFixed(1)}</td>
                      <td style={numCell}>{h.momentum_score.toFixed(1)}</td>
                      <td style={{ padding: "8px" }}>
                        <span style={{ fontSize: 11, color: SECTOR_COLORS[h.sector] || T.dim }}>{h.sector}</span>
                      </td>
                      <td style={numCell}>${h.close?.toFixed(2) || "\u2014"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Expanded detail */}
          {expandedRow && (() => {
            const h = portfolio.portfolio.find((p) => p.ticker === expandedRow);
            if (!h) return null;
            return (
              <div style={{
                padding: "12px", background: T.card, borderTop: `1px solid ${T.border}`,
                borderRadius: "0 0 4px 4px", fontSize: 12, marginTop: 4,
              }}>
                <div style={{ color: T.dim, lineHeight: 1.6 }}>{h.rationale}</div>
                {h.signals?.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {h.signals.map((s, i) => (
                      <span key={i} style={{ padding: "2px 8px", borderRadius: 2, fontSize: 10, background: `${T.green}20`, color: T.green }}>{s}</span>
                    ))}
                  </div>
                )}
                {h.warnings?.length > 0 && (
                  <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {h.warnings.map((w, i) => (
                      <span key={i} style={{ padding: "2px 8px", borderRadius: 2, fontSize: 10, background: `${T.red}20`, color: T.red }}>{w}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </Panel>

        {/* Two-column: Top Conviction + Options Flow */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Top Conviction */}
          <Panel title="TOP CONVICTION" tag="TOP 5">
            {equities.slice(0, 5).map((h, i) => (
              <div key={h.ticker} style={{
                padding: "10px 0",
                borderBottom: i < 4 ? `1px solid ${T.border}40` : "none",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{h.ticker}</span>
                    <span style={{ color: T.dim, fontSize: 11, marginLeft: 8 }}>{h.weight_pct}%</span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor(h.quality_score) }}>
                    {h.quality_score.toFixed(1)}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: T.dim, marginTop: 4, lineHeight: 1.4 }}>
                  {h.rationale?.slice(0, 100)}...
                </div>
              </div>
            ))}
          </Panel>

          {/* Options Flow */}
          <Panel title="OPTIONS FLOW" tag={flow?.available ? flow.scan_date : "NO DATA"} tagColor={flow?.available ? T.green : T.red}>
            {flow?.available ? (
              <>
                <div style={{ fontSize: 10, color: T.dim, marginBottom: 10 }}>
                  Expiration: {flow.expiration}
                </div>
                {equities.map((h) => {
                  const f = flow.tickers?.[h.ticker];
                  if (!f) return null;
                  const bull = f.put_call_ratio != null && f.put_call_ratio < 0.5;
                  return (
                    <div key={h.ticker} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "6px 0", borderBottom: `1px solid ${T.border}40`, fontSize: 12,
                    }}>
                      <span style={{ fontWeight: 500 }}>{h.ticker}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: T.dim, fontSize: 11 }}>P/C {f.put_call_ratio?.toFixed(2)}</span>
                        <span style={{
                          padding: "2px 6px", borderRadius: 2, fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                          background: bull ? `${T.green}20` : `${T.red}20`,
                          color: bull ? T.green : T.red,
                        }}>
                          {bull ? "BULL" : "BEAR"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div style={{ color: T.dim, fontSize: 11, textAlign: "center", padding: "24px 0" }}>
                No LSEG flow data available.<br />
                Click "Full + LSEG" to scan with bridge.
              </div>
            )}
          </Panel>
        </div>

        {/* Macro Context */}
        {portfolio.macro && (
          <Panel title="MACRO CONTEXT" tag={portfolio.macro.risk_appetite?.toUpperCase() || "N/A"} tagColor={portfolio.macro.risk_appetite === "risk_on" ? T.green : portfolio.macro.risk_appetite === "risk_off" ? T.red : T.amber} style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <StatCard
                label="10Y YIELD"
                value={portfolio.macro.yield_10y?.toFixed(2) || "N/A"}
                color={T.text}
                sub={portfolio.macro.yield_10y_change_5d != null ? `5d: ${portfolio.macro.yield_10y_change_5d > 0 ? "+" : ""}${portfolio.macro.yield_10y_change_5d.toFixed(2)}` : ""}
              />
              <StatCard
                label="CREDIT SPREADS"
                value={portfolio.macro.credit_spread_trend || "N/A"}
                color={portfolio.macro.credit_spread_trend === "tightening" ? T.green : portfolio.macro.credit_spread_trend === "widening" ? T.red : T.text}
              />
              <StatCard
                label="USD TREND"
                value={portfolio.macro.dollar_trend || "N/A"}
                color={T.text}
              />
              <StatCard
                label="RISK APPETITE"
                value={portfolio.macro.risk_appetite || "N/A"}
                color={portfolio.macro.risk_appetite === "risk_on" ? T.green : portfolio.macro.risk_appetite === "risk_off" ? T.red : T.amber}
              />
            </div>
            {portfolio.macro.leading_sectors?.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 11 }}>
                <span style={{ color: T.dim }}>Leading: </span>
                {portfolio.macro.leading_sectors.map((s) => (
                  <span key={s} style={{ color: T.green, marginRight: 8 }}>{s} ({portfolio.macro.sector_momentum?.[s]?.toFixed(1)}%)</span>
                ))}
                {portfolio.macro.lagging_sectors?.length > 0 && (
                  <>
                    <span style={{ color: T.dim, marginLeft: 8 }}>Lagging: </span>
                    {portfolio.macro.lagging_sectors.map((s) => (
                      <span key={s} style={{ color: T.red, marginRight: 8 }}>{s} ({portfolio.macro.sector_momentum?.[s]?.toFixed(1)}%)</span>
                    ))}
                  </>
                )}
              </div>
            )}
          </Panel>
        )}

        {/* Scoring Methodology */}
        <Panel title="SCORING METHODOLOGY" tag="7 FACTORS" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: T.dim, marginBottom: 12, lineHeight: 1.5 }}>
            Multi-factor quality scoring: technicals, institutional flow, volume profile (OBV/MFI/A-D), news sentiment (VADER NLP), macro-enriched regime, ADX trend strength, and momentum. Scores normalized 0-100.
          </div>
          {[
            ["Technical", "EMA alignment, structure proximity, gap detection", 20, T.amber],
            ["Options Flow", "Put/call ratio, unusual activity, vol/OI ratio", 20, T.green],
            ["Volume Profile", "OBV trend, Money Flow Index, accumulation/distribution", 15, "#22d3ee"],
            ["News Sentiment", "VADER NLP on recent headlines, keyword amplification", 10, "#a855f7"],
            ["Regime + Macro", "VIX regime, yields, credit spreads, sector momentum, USD", 15, "#eab308"],
            ["ADX Trend", "Average Directional Index, trend strength", 10, T.blue],
            ["Momentum", "EMA alignment, 5/20-day ROC, delta flow", 10, "#ec4899"],
          ].map(([name, desc, weight, color]) => (
            <div key={name} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: `1px solid ${T.border}40`,
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{name}</div>
                <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{desc}</div>
              </div>
              <span style={{
                padding: "3px 8px", borderRadius: 2, fontSize: 11, fontWeight: 700,
                background: `${color}26`, color,
              }}>{weight}%</span>
            </div>
          ))}
        </Panel>

        {/* Two-column: Sector + Competition */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Sector Allocation */}
          <Panel title="SECTOR ALLOCATION" tag={`${sectorData.length} SECTORS`}>
            {sectorData.map((s) => (
              <div key={s.name} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: SECTOR_COLORS[s.name] || T.dim }}>{s.name}</span>
                  <span style={{ fontWeight: 600 }}>{s.value}%</span>
                </div>
                <div style={{ height: 4, background: T.card, borderRadius: 2 }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    width: `${(s.value / Math.max(...sectorData.map(d => d.value))) * 100}%`,
                    background: SECTOR_COLORS[s.name] || T.dim, opacity: 0.7,
                  }} />
                </div>
              </div>
            ))}
          </Panel>

          {/* Competition */}
          <Panel title="COMPETITION" tag="VANDY 2026">
            {[
              ["Period", "Mar 11 \u2013 Apr 22, 2026"],
              ["Scoring", "25% Ret · 30% Sharpe · 20% DD · 25% Alpha"],
              ["Positions", "10\u201325 stocks, integer weights, sum to 100%"],
              ["Rebalance", "Max 2/week, thesis-driven"],
              ["Anchors", `GLD 5%`],
              ["Updated", new Date(portfolio.generated_at).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                padding: "6px 0", borderBottom: `1px solid ${T.border}40`, fontSize: 12,
              }}>
                <span style={{ color: T.dim }}>{label}</span>
                <span style={{ textAlign: "right", maxWidth: "60%", fontSize: 11 }}>{value}</span>
              </div>
            ))}
          </Panel>
        </div>

        {/* Excluded Stocks */}
        {portfolio.excluded?.length > 0 && (
          <Panel title="EXCLUDED STOCKS" tag={`${portfolio.excluded.length} BELOW THRESHOLD`} tagColor={T.red} style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {portfolio.excluded.map((e) => (
                <div key={e.ticker} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "4px 8px", borderRadius: 2, background: T.card,
                  border: `1px solid ${T.border}`,
                }}>
                  <span style={{ fontWeight: 600, color: T.red, fontSize: 12 }}>{e.ticker}</span>
                  <span style={{ color: T.dim, fontSize: 10 }}>{e.reason}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Footer */}
        <div style={{ fontSize: 10, color: T.dim, textAlign: "center", padding: "8px 0" }}>
          AlphaForge Competition · Vanderbilt Owen MS Finance · For educational purposes only. Not financial advice.
        </div>
      </div>
    </div>
  );
}

const numCell = { padding: "8px", textAlign: "right", color: "#707070", fontSize: 11 };
