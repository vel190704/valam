'use client'
import { useState, useMemo } from 'react'
import DNavbar from '@/components/layout/dnavbar'

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
  :root {
    --bg:#EFEDE8; --surface:#F5F3EF; --surface2:#EAE7E1;
    --border:rgba(180,155,110,0.18); --border-md:rgba(180,155,110,0.32);
    --gold:#B8924A; --gold-lt:#D4AD72; --bronze:#8F6828;
    --muted:#7A6E5F; --text:#1E1C18; --text-sm:#3A3630;
    --green:#4A7A4A; --red:#C0392B; --blue:#3B82F6;
  }
  body.dark {
    --bg:#231512; --surface:#2C1A16; --surface2:#3A2218;
    --border:rgba(201,168,76,0.15); --border-md:rgba(201,168,76,0.28);
    --gold:#C9A84C; --gold-lt:#F0D080; --bronze:#8B6914;
    --muted:#B89A72; --text:#F5F0E8; --text-sm:#D4C4A8;
    --green:#4CAF50; --red:#E57373; --blue:#60A5FA;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);color:var(--text);font-family:Inter,sans-serif;}
  ::-webkit-scrollbar{width:5px;}
  ::-webkit-scrollbar-track{background:var(--surface2);}
  ::-webkit-scrollbar-thumb{background:var(--border-md);border-radius:10px;}
  input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;background:var(--surface2);outline:none;cursor:pointer;}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--gold);cursor:pointer;border:2px solid var(--surface);box-shadow:0 1px 4px rgba(0,0,0,0.2);}
  input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--gold);cursor:pointer;border:2px solid var(--surface);}
  input[type=number]{background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:6px 10px;font-size:13px;font-family:Inter,sans-serif;width:100%;}
  input[type=number]:focus{outline:none;border-color:var(--gold);}
  input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{opacity:1;}
  input[type=text]{background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:6px 10px;font-size:13px;font-family:Inter,sans-serif;width:100%;}
  input[type=text]:focus{outline:none;border-color:var(--gold);}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}
  .calc-enter{animation:fadeIn 0.2s ease both;}
  .result-enter{animation:fadeIn 0.18s ease both;}
`

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtINR(n: number): string {
  if (isNaN(n) || !isFinite(n)) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

function fmtCompact(n: number): string {
  if (isNaN(n) || !isFinite(n)) return '₹0'
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`
  return fmtINR(n)
}

function fmtPct(n: number): string {
  if (isNaN(n) || !isFinite(n)) return '0%'
  return `${n.toFixed(2)}%`
}

function sipFV(monthly: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12
  const n = years * 12
  if (r === 0) return monthly * n
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
}

function stepupSipFV(monthly: number, annualReturn: number, years: number, annualStep: number): number {
  const r = annualReturn / 100 / 12
  let fv = 0, amt = monthly
  for (let y = 0; y < years; y++) {
    for (let m = 0; m < 12; m++) fv = (fv + amt) * (1 + r)
    amt *= 1 + annualStep / 100
  }
  return fv
}

function lumpsumFV(amount: number, annualRate: number, years: number): number {
  return amount * Math.pow(1 + annualRate / 100, years)
}

function sipNeeded(fv: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12
  const n = years * 12
  if (r === 0) return n === 0 ? 0 : fv / n
  return (fv * r) / ((Math.pow(1 + r, n) - 1) * (1 + r))
}

// ── SVG Line Chart ─────────────────────────────────────────────────────────────

interface ChartSeries { data: number[]; color: string; label: string; dashed?: boolean }

function LineChart({
  series, xLabels, yFormat, gradientId,
}: {
  series: ChartSeries[]
  xLabels: string[]
  yFormat?: (v: number) => string
  gradientId: string
}) {
  const W = 500, H = 180
  const pad = { t: 16, r: 16, b: 36, l: 58 }
  const iW = W - pad.l - pad.r
  const iH = H - pad.t - pad.b

  const allVals = series.flatMap(s => s.data).filter(v => isFinite(v))
  if (allVals.length === 0) return null

  const maxV = Math.max(...allVals) * 1.05
  const minV = 0
  const range = maxV - minV || 1
  const n = Math.max(...series.map(s => s.data.length))

  const toX = (i: number) => pad.l + (i / (n - 1)) * iW
  const toY = (v: number) => pad.t + iH - ((v - minV) / range) * iH
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => minV + f * range)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
      <defs>
        {series.map((s, si) => (
          <linearGradient key={si} id={`${gradientId}-${si}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
          </linearGradient>
        ))}
      </defs>

      {yTicks.map((v, i) => {
        const y = toY(v)
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y}
              stroke="var(--border)" strokeWidth={1} strokeDasharray="3 4" />
            <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize={9} fill="var(--muted)">
              {yFormat ? yFormat(v) : fmtCompact(v).replace('₹', '')}
            </text>
          </g>
        )
      })}

      {series.map((s, si) => {
        if (s.data.length < 2) return null
        const pts = s.data.map((v, i) => ({ x: toX(i), y: toY(v) }))
        const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
        const areaPath = `${linePath} L${pts[pts.length-1].x.toFixed(1)},${(pad.t+iH).toFixed(1)} L${pts[0].x.toFixed(1)},${(pad.t+iH).toFixed(1)} Z`
        return (
          <g key={si}>
            <path d={areaPath} fill={`url(#${gradientId}-${si})`} />
            <path d={linePath} fill="none" stroke={s.color} strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={s.dashed ? '6 4' : undefined} />
          </g>
        )
      })}

      {xLabels.filter((_, i) => {
        const step = Math.ceil(xLabels.length / 6)
        return i === 0 || i === xLabels.length - 1 || i % step === 0
      }).map(lbl => {
        const i = xLabels.indexOf(lbl)
        return (
          <text key={i} x={toX(i)} y={H - 8} textAnchor="middle" fontSize={9} fill="var(--muted)">
            {lbl}
          </text>
        )
      })}
    </svg>
  )
}

// ── Chart placeholder (shown before user interaction) ─────────────────────────

function ChartPlaceholder({ label }: { label: string }) {
  return (
    <div style={{
      height: 160, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>
      <svg width={48} height={40} viewBox="0 0 48 40" style={{ opacity: 0.25 }}>
        <polyline points="0,38 12,28 24,18 36,10 48,2"
          fill="none" stroke="var(--gold)" strokeWidth={2.5} strokeLinecap="round" />
        <line x1={0} y1={39} x2={48} y2={39} stroke="var(--border)" strokeWidth={1} />
      </svg>
      <span style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
        {label}
      </span>
    </div>
  )
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function SliderRow({
  label, value, min, max, step, onChange, display, prefix = '',
}: {
  label: string; value: number; min: number; max: number
  step: number; onChange: (v: number) => void
  display?: string; prefix?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)',
          background: 'var(--surface2)', borderRadius: 6,
          padding: '2px 8px', border: '1px solid var(--border)' }}>
          {display ?? `${prefix}${value.toLocaleString('en-IN')}`}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--muted)' }}>
        <span>{prefix}{min.toLocaleString('en-IN')}</span>
        <span>{prefix}{max.toLocaleString('en-IN')}</span>
      </div>
    </div>
  )
}

// value is null until the user interacts — shows '—' with muted styling
function ResultCard({
  label, value, sub, accent = 'var(--gold)', large = false,
}: {
  label: string; value: string | null; sub?: string
  accent?: string; large?: boolean
}) {
  const ready = value !== null
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: large ? '16px 18px' : '12px 16px' }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase',
        letterSpacing: '0.07em', marginBottom: 4 }}>
        {label}
      </div>
      <div className={ready ? 'result-enter' : undefined}
        style={{ fontFamily: 'Playfair Display,serif',
          fontSize: large ? 22 : 18, fontWeight: 700,
          color: ready ? accent : 'var(--border-md)', lineHeight: 1.2,
          transition: 'color 0.2s' }}>
        {ready ? value : '—'}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{sub}</div>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 17,
      fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
      {children}
    </div>
  )
}

function CopyBtn({ text, disabled }: { text: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      disabled={disabled}
      onClick={() => {
        void navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      }}
      style={{ background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '5px 14px', fontSize: 11,
        color: disabled ? 'var(--border-md)' : 'var(--muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Inter,sans-serif', opacity: disabled ? 0.5 : 1 }}>
      {copied ? '✓ Copied' : 'Copy Results'}
    </button>
  )
}

function CalcShell({ inputs, results }: { inputs: React.ReactNode; results: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '24px 22px',
        display: 'flex', flexDirection: 'column', gap: 20 }}>
        {inputs}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {results}
      </div>
    </div>
  )
}

// ── Hint shown before first interaction ──────────────────────────────────────

function UntouchedHint() {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '28px 24px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      flex: 1 }}>
      <div style={{ fontSize: 24, opacity: 0.35 }}>📊</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
        Move any slider on the left<br />to see your results here.
      </div>
    </div>
  )
}

// ── 1. Investment Calculator ───────────────────────────────────────────────────

function InvestmentCalc() {
  const [touched, setTouched] = useState(false)
  const [mode,    setMode]    = useState<'sip' | 'stepup' | 'lumpsum'>('sip')
  const [amount,  setAmount]  = useState(10000)
  const [rate,    setRate]    = useState(12)
  const [years,   setYears]   = useState(15)
  const [stepup,  setStepup]  = useState(10)

  // Mark touched + call setter in one step
  function touch<T>(setter: (v: T) => void) {
    return (v: T) => { setTouched(true); setter(v) }
  }

  function reset() {
    setAmount(10000); setRate(12); setYears(15); setStepup(10)
    setTouched(false)
  }

  const res = useMemo(() => {
    if (mode === 'sip') {
      const fv = sipFV(amount, rate, years)
      const inv = amount * 12 * years
      return { fv, inv, returns: fv - inv }
    }
    if (mode === 'stepup') {
      const fv = stepupSipFV(amount, rate, years, stepup)
      let inv = 0, m = amount
      for (let y = 0; y < years; y++) { inv += m * 12; m *= 1 + stepup / 100 }
      return { fv, inv, returns: fv - inv }
    }
    const fv = lumpsumFV(amount, rate, years)
    return { fv, inv: amount, returns: fv - amount }
  }, [mode, amount, rate, years, stepup])

  const chartData = useMemo(() => {
    const labels = Array.from({ length: years + 1 }, (_, i) => `Yr ${i}`)
    const invested: number[] = [], total: number[] = []
    for (let y = 0; y <= years; y++) {
      if (mode === 'sip') {
        invested.push(amount * 12 * y)
        total.push(y === 0 ? 0 : sipFV(amount, rate, y))
      } else if (mode === 'stepup') {
        let inv = 0, m = amount
        for (let k = 0; k < y; k++) { inv += m * 12; m *= 1 + stepup / 100 }
        invested.push(inv)
        total.push(y === 0 ? 0 : stepupSipFV(amount, rate, y, stepup))
      } else {
        invested.push(amount)
        total.push(lumpsumFV(amount, rate, y))
      }
    }
    return { labels, invested, total }
  }, [mode, amount, rate, years, stepup])

  const copyText = `Investment Calculator\nMode: ${mode.toUpperCase()}\nTotal Invested: ${fmtINR(res.inv)}\nEstimated Returns: ${fmtINR(res.returns)}\nFuture Value: ${fmtINR(res.fv)}`

  return (
    <CalcShell
      inputs={
        <>
          <SectionTitle>Investment Calculator</SectionTitle>
          <div style={{ display: 'flex', gap: 6, background: 'var(--surface2)',
            borderRadius: 10, padding: 4 }}>
            {(['sip', 'stepup', 'lumpsum'] as const).map(m => (
              <button key={m}
                onClick={() => { setTouched(true); setMode(m) }}
                style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: 'none',
                  background: mode === m ? 'var(--gold)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--muted)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Inter,sans-serif', transition: 'all 0.15s' }}>
                {m === 'sip' ? 'SIP' : m === 'stepup' ? 'Step-up' : 'Lumpsum'}
              </button>
            ))}
          </div>
          <SliderRow
            label={mode === 'lumpsum' ? 'Lumpsum Amount' : 'Monthly SIP'}
            value={amount} min={500} max={200000} step={500}
            onChange={touch(setAmount)} prefix="₹" />
          <SliderRow label="Expected Annual Return (%)" value={rate} min={1} max={30} step={0.5}
            onChange={touch(setRate)} display={`${rate}%`} />
          <SliderRow label="Investment Duration" value={years} min={1} max={40} step={1}
            onChange={touch(setYears)} display={`${years} yrs`} />
          {mode === 'stepup' && (
            <SliderRow label="Annual Step-up (%)" value={stepup} min={0} max={50} step={1}
              onChange={touch(setStepup)} display={`${stepup}%`} />
          )}
          <button onClick={reset}
            style={{ background: 'none', border: '1px solid var(--border)',
              borderRadius: 20, padding: '6px 18px', fontSize: 11, color: 'var(--muted)',
              cursor: 'pointer', fontFamily: 'Inter,sans-serif', alignSelf: 'flex-start' }}>
            Reset
          </button>
        </>
      }
      results={
        <>
          {!touched ? <UntouchedHint /> : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <ResultCard label="Total Invested"    value={touched ? fmtCompact(res.inv)     : null} accent="var(--text)"  large />
                <ResultCard label="Future Value"      value={touched ? fmtCompact(res.fv)      : null} accent="var(--gold)"  large />
                <ResultCard label="Estimated Returns" value={touched ? fmtCompact(res.returns) : null} accent="var(--green)" />
                <ResultCard label="Wealth Gained"
                  value={touched ? fmtPct(res.returns / res.inv * 100) : null}
                  sub="return on investment" accent="var(--blue)" />
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '16px 16px 8px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>Annual Growth Chart</div>
                {touched
                  ? <LineChart
                      series={[
                        { data: chartData.invested, color: 'var(--muted)', label: 'Invested', dashed: true },
                        { data: chartData.total,    color: '#B8924A',      label: 'Value' },
                      ]}
                      xLabels={chartData.labels} gradientId="inv" />
                  : <ChartPlaceholder label="Move a slider to see your growth projection" />
                }
                {touched && (
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
                    {[{ c: 'var(--muted)', l: 'Invested' }, { c: '#B8924A', l: 'Value' }].map(({ c, l }) => (
                      <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--muted)' }}>
                        <div style={{ width: 16, height: 2, background: c, borderRadius: 1 }} />
                        {l}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <CopyBtn text={copyText} disabled={!touched} />
              </div>
            </>
          )}
        </>
      }
    />
  )
}

// ── 2. Goal Planner ───────────────────────────────────────────────────────────

function GoalCalc() {
  const [touched,  setTouched]  = useState(false)
  const [goalName, setGoalName] = useState('My Goal')
  const [goalAmt,  setGoalAmt]  = useState(5000000)
  const [years,    setYears]    = useState(10)
  const [rate,     setRate]     = useState(12)
  const [existing, setExisting] = useState(0)

  function touch<T>(setter: (v: T) => void) {
    return (v: T) => { setTouched(true); setter(v) }
  }

  function reset() {
    setGoalAmt(5000000); setYears(10); setRate(12)
    setExisting(0); setGoalName('My Goal'); setTouched(false)
  }

  const res = useMemo(() => {
    const existingFV = lumpsumFV(existing, rate, years)
    const remaining  = Math.max(0, goalAmt - existingFV)
    const sip        = sipNeeded(remaining, rate, years)
    const lumpsum    = remaining / Math.pow(1 + rate / 100, years)
    return { sip, lumpsum, totalInv: sip * 12 * years, existingFV }
  }, [goalAmt, years, rate, existing])

  const chartData = useMemo(() => {
    const labels: string[] = [], savings: number[] = [], target: number[] = []
    for (let y = 0; y <= years; y++) {
      labels.push(`Yr ${y}`)
      savings.push((y === 0 ? 0 : sipFV(res.sip, rate, y)) + lumpsumFV(existing, rate, y))
      target.push(goalAmt)
    }
    return { labels, savings, target }
  }, [res.sip, years, rate, existing, goalAmt])

  const copyText = `Goal Planner: ${goalName}\nGoal: ${fmtINR(goalAmt)}\nMonthly SIP: ${fmtINR(res.sip)}\nLumpsum Today: ${fmtINR(res.lumpsum)}`

  return (
    <CalcShell
      inputs={
        <>
          <SectionTitle>Goal Planner</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Goal Name</span>
            <input type="text" value={goalName}
              onChange={e => { setTouched(true); setGoalName(e.target.value) }}
              placeholder="e.g. Retirement, House, Education" />
          </div>
          <SliderRow label="Goal Amount" value={goalAmt}
            min={100000} max={50000000} step={100000}
            onChange={touch(setGoalAmt)} prefix="₹" />
          <SliderRow label="Years to Goal" value={years}
            min={1} max={40} step={1} onChange={touch(setYears)} display={`${years} yrs`} />
          <SliderRow label="Expected Annual Return (%)" value={rate}
            min={1} max={30} step={0.5} onChange={touch(setRate)} display={`${rate}%`} />
          <SliderRow label="Existing Savings (Optional)" value={existing}
            min={0} max={5000000} step={10000} onChange={touch(setExisting)} prefix="₹" />
          <button onClick={reset}
            style={{ background: 'none', border: '1px solid var(--border)',
              borderRadius: 20, padding: '6px 18px', fontSize: 11, color: 'var(--muted)',
              cursor: 'pointer', fontFamily: 'Inter,sans-serif', alignSelf: 'flex-start' }}>
            Reset
          </button>
        </>
      }
      results={
        <>
          {!touched ? <UntouchedHint /> : (
            <>
              <div style={{ background: 'var(--gold)', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase',
                  letterSpacing: '0.07em', marginBottom: 4 }}>Goal: {goalName}</div>
                <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28,
                  fontWeight: 700, color: '#fff' }}>{fmtCompact(goalAmt)}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
                  Target in {years} years
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <ResultCard label="Monthly SIP Required"   value={fmtCompact(res.sip)}     accent="var(--gold)"  large />
                <ResultCard label="Lumpsum Required Today" value={fmtCompact(res.lumpsum)}  accent="var(--green)" large />
                <ResultCard label="Total Investment"       value={fmtCompact(res.totalInv)} accent="var(--text)" />
                <ResultCard label="Existing Savings Grow To" value={fmtCompact(res.existingFV)} accent="var(--muted)" />
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '16px 16px 8px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>Goal Timeline Chart</div>
                <LineChart
                  series={[
                    { data: chartData.savings, color: '#B8924A', label: 'Savings' },
                    { data: chartData.target,  color: '#4A7A4A', label: 'Goal', dashed: true },
                  ]}
                  xLabels={chartData.labels} gradientId="goal" />
                <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
                  {[{ c: '#B8924A', l: 'Savings' }, { c: '#4A7A4A', l: 'Goal' }].map(({ c, l }) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--muted)' }}>
                      <div style={{ width: 16, height: 2, background: c, borderRadius: 1 }} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <CopyBtn text={copyText} disabled={!touched} />
              </div>
            </>
          )}
        </>
      }
    />
  )
}

// ── 3. FIRE Calculator ────────────────────────────────────────────────────────

function FireCalc() {
  const [touched,     setTouched]     = useState(false)
  const [monthlyExp,  setMonthlyExp]  = useState(50000)
  const [inflation,   setInflation]   = useState(6)
  const [swr,         setSwr]         = useState(4)
  const [currentInv,  setCurrentInv]  = useState(500000)
  const [annualRet,   setAnnualRet]   = useState(12)
  const [monthlyInv,  setMonthlyInv]  = useState(30000)
  const [currentAge,  setCurrentAge]  = useState(28)
  const [targetAge,   setTargetAge]   = useState(45)

  function touch<T>(setter: (v: T) => void) {
    return (v: T) => { setTouched(true); setter(v) }
  }

  function reset() {
    setMonthlyExp(50000); setInflation(6); setSwr(4); setCurrentInv(500000)
    setAnnualRet(12); setMonthlyInv(30000); setCurrentAge(28); setTargetAge(45)
    setTouched(false)
  }

  const res = useMemo(() => {
    const yearsToFire   = Math.max(0, targetAge - currentAge)
    const adjExpenses   = monthlyExp * 12 * Math.pow(1 + inflation / 100, yearsToFire)
    const fireCorpus    = swr > 0 ? adjExpenses / (swr / 100) : 0
    const r             = annualRet / 100 / 12
    const n             = yearsToFire * 12
    const sipGrowth     = r > 0
      ? monthlyInv * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
      : monthlyInv * n
    const currentGrowth = currentInv * Math.pow(1 + annualRet / 100, yearsToFire)
    const projected     = sipGrowth + currentGrowth
    const progress      = fireCorpus > 0 ? Math.min(100, projected / fireCorpus * 100) : 0
    const reqSip        = sipNeeded(Math.max(0, fireCorpus - currentGrowth), annualRet, yearsToFire)
    return { fireCorpus, projected, progress, reqSip, yearsToFire, adjExpenses }
  }, [monthlyExp, inflation, swr, currentInv, annualRet, monthlyInv, currentAge, targetAge])

  const chartData = useMemo(() => {
    const yrs = Math.max(res.yearsToFire + 10, 20)
    const labels: string[] = [], wealth: number[] = [], fireTarget: number[] = []
    const r = annualRet / 100 / 12
    let w = currentInv
    for (let y = 0; y <= yrs; y++) {
      labels.push(`Age ${currentAge + y}`)
      wealth.push(w)
      fireTarget.push(res.fireCorpus)
      if (y < yrs) for (let m = 0; m < 12; m++) w = (w + monthlyInv) * (1 + r)
    }
    return { labels, wealth, fireTarget }
  }, [currentInv, monthlyInv, annualRet, currentAge, res.fireCorpus, res.yearsToFire])

  const copyText = `FIRE Calculator\nRequired Corpus: ${fmtINR(res.fireCorpus)}\nProjected: ${fmtINR(res.projected)}\nYears to FIRE: ${res.yearsToFire}\nProgress: ${fmtPct(res.progress)}`

  return (
    <CalcShell
      inputs={
        <>
          <SectionTitle>FIRE Calculator</SectionTitle>
          <SliderRow label="Current Monthly Expenses" value={monthlyExp}
            min={5000} max={500000} step={1000} onChange={touch(setMonthlyExp)} prefix="₹" />
          <SliderRow label="Expected Inflation (%)" value={inflation}
            min={1} max={15} step={0.5} onChange={touch(setInflation)} display={`${inflation}%`} />
          <SliderRow label="Safe Withdrawal Rate (%)" value={swr}
            min={1} max={10} step={0.25} onChange={touch(setSwr)} display={`${swr}%`} />
          <SliderRow label="Current Investments" value={currentInv}
            min={0} max={10000000} step={50000} onChange={touch(setCurrentInv)} prefix="₹" />
          <SliderRow label="Expected Annual Return (%)" value={annualRet}
            min={1} max={25} step={0.5} onChange={touch(setAnnualRet)} display={`${annualRet}%`} />
          <SliderRow label="Monthly Investment" value={monthlyInv}
            min={1000} max={500000} step={1000} onChange={touch(setMonthlyInv)} prefix="₹" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <SliderRow label="Current Age" value={currentAge}
              min={18} max={60} step={1} onChange={touch(setCurrentAge)} display={`${currentAge} yrs`} />
            <SliderRow label="Target FIRE Age" value={targetAge}
              min={currentAge + 1} max={70} step={1}
              onChange={v => { setTouched(true); setTargetAge(Math.max(currentAge + 1, v)) }}
              display={`${targetAge} yrs`} />
          </div>
          <button onClick={reset}
            style={{ background: 'none', border: '1px solid var(--border)',
              borderRadius: 20, padding: '6px 18px', fontSize: 11, color: 'var(--muted)',
              cursor: 'pointer', fontFamily: 'Inter,sans-serif', alignSelf: 'flex-start' }}>
            Reset
          </button>
        </>
      }
      results={
        <>
          {!touched ? <UntouchedHint /> : (
            <>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>FIRE Progress</span>
                  <span style={{ fontFamily: 'Playfair Display,serif', fontSize: 18,
                    fontWeight: 700, color: 'var(--gold)' }}>{fmtPct(res.progress)}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--surface2)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4,
                    background: 'linear-gradient(90deg, var(--gold), var(--green))',
                    width: `${res.progress}%`, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                  {res.yearsToFire} years to target FIRE age ({targetAge})
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <ResultCard label="Required FIRE Corpus"  value={fmtCompact(res.fireCorpus)} accent="var(--gold)"  large />
                <ResultCard label="Projected Corpus"      value={fmtCompact(res.projected)}
                  accent={res.projected >= res.fireCorpus ? 'var(--green)' : 'var(--red)'} large />
                <ResultCard label="Required Monthly SIP"  value={fmtCompact(res.reqSip)}      accent="var(--text)" />
                <ResultCard label="Inflation-adj Exp/yr"  value={fmtCompact(res.adjExpenses)}
                  sub={`at FIRE age ${targetAge}`} accent="var(--muted)" />
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '16px 16px 8px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>Wealth Growth Chart</div>
                <LineChart
                  series={[
                    { data: chartData.wealth,     color: '#B8924A', label: 'Wealth' },
                    { data: chartData.fireTarget, color: '#4A7A4A', label: 'FIRE Target', dashed: true },
                  ]}
                  xLabels={chartData.labels} gradientId="fire" />
                <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
                  {[{ c: '#B8924A', l: 'Wealth' }, { c: '#4A7A4A', l: 'FIRE Target' }].map(({ c, l }) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--muted)' }}>
                      <div style={{ width: 16, height: 2, background: c, borderRadius: 1 }} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <CopyBtn text={copyText} disabled={!touched} />
              </div>
            </>
          )}
        </>
      }
    />
  )
}

// ── 4. Inflation Calculator ───────────────────────────────────────────────────

function InflationCalc() {
  const [touched,   setTouched]   = useState(false)
  const [amount,    setAmount]    = useState(1000000)
  const [inflation, setInflation] = useState(6)
  const [years,     setYears]     = useState(20)

  function touch<T>(setter: (v: T) => void) {
    return (v: T) => { setTouched(true); setter(v) }
  }

  function reset() {
    setAmount(1000000); setInflation(6); setYears(20); setTouched(false)
  }

  const res = useMemo(() => {
    const futureRequired  = lumpsumFV(amount, inflation, years)
    const purchasingPower = amount / Math.pow(1 + inflation / 100, years)
    const powerLoss       = amount - purchasingPower
    return { futureRequired, purchasingPower, powerLoss, lossPercent: powerLoss / amount * 100 }
  }, [amount, inflation, years])

  const chartData = useMemo(() => {
    const labels: string[] = [], realValue: number[] = [], required: number[] = []
    for (let y = 0; y <= years; y++) {
      labels.push(`Yr ${y}`)
      realValue.push(amount / Math.pow(1 + inflation / 100, y))
      required.push(lumpsumFV(amount, inflation, y))
    }
    return { labels, realValue, required }
  }, [amount, inflation, years])

  const copyText = `Inflation Calculator\nAmount: ${fmtINR(amount)}\nAfter ${years} yrs @ ${inflation}%\nFuture Value Required: ${fmtINR(res.futureRequired)}\nPurchasing Power Loss: ${fmtINR(res.powerLoss)}`

  return (
    <CalcShell
      inputs={
        <>
          <SectionTitle>Inflation Calculator</SectionTitle>
          <SliderRow label="Current Amount" value={amount}
            min={10000} max={50000000} step={10000} onChange={touch(setAmount)} prefix="₹" />
          <SliderRow label="Inflation Rate (%)" value={inflation}
            min={1} max={20} step={0.5} onChange={touch(setInflation)} display={`${inflation}%`} />
          <SliderRow label="Number of Years" value={years}
            min={1} max={50} step={1} onChange={touch(setYears)} display={`${years} yrs`} />

          {touched && (
            <div style={{ background: 'rgba(184,146,74,0.08)', borderRadius: 10,
              padding: '12px 14px', border: '1px solid rgba(184,146,74,0.2)' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Summary</div>
              <div style={{ fontSize: 12, color: 'var(--text-sm)', lineHeight: 1.7 }}>
                Today: <strong>{fmtCompact(amount)}</strong><br />
                After {years} yrs at {inflation}%:<br />
                <strong style={{ color: 'var(--gold)' }}>{fmtCompact(res.futureRequired)}</strong>
              </div>
            </div>
          )}

          <button onClick={reset}
            style={{ background: 'none', border: '1px solid var(--border)',
              borderRadius: 20, padding: '6px 18px', fontSize: 11, color: 'var(--muted)',
              cursor: 'pointer', fontFamily: 'Inter,sans-serif', alignSelf: 'flex-start' }}>
            Reset
          </button>
        </>
      }
      results={
        <>
          {!touched ? <UntouchedHint /> : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <ResultCard label="Future Value Required"  value={fmtCompact(res.futureRequired)}  accent="var(--gold)"  large />
                <ResultCard label="Real Value of Today's ₹" value={fmtCompact(res.purchasingPower)}
                  sub="purchasing power left" accent="var(--red)" large />
                <ResultCard label="Purchasing Power Loss"  value={fmtCompact(res.powerLoss)}       accent="var(--red)" />
                <ResultCard label="Value Erosion"          value={fmtPct(res.lossPercent)}
                  sub={`over ${years} years`} accent="var(--muted)" />
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '16px 16px 8px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>Inflation Impact Chart</div>
                <LineChart
                  series={[
                    { data: chartData.required,  color: '#B8924A', label: 'Required Value' },
                    { data: chartData.realValue, color: '#C0392B', label: 'Real Value', dashed: true },
                  ]}
                  xLabels={chartData.labels} gradientId="infl" />
                <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
                  {[{ c: '#B8924A', l: 'Required' }, { c: '#C0392B', l: 'Real Value' }].map(({ c, l }) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--muted)' }}>
                      <div style={{ width: 16, height: 2, background: c, borderRadius: 1 }} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <CopyBtn text={copyText} disabled={!touched} />
              </div>
            </>
          )}
        </>
      }
    />
  )
}

// ── 5. CAGR Calculator ────────────────────────────────────────────────────────

function CagrCalc() {
  const [touched, setTouched] = useState(false)
  const [initial, setInitial] = useState(100000)
  const [final,   setFinal]   = useState(350000)
  const [years,   setYears]   = useState(5)

  function touch<T>(setter: (v: T) => void) {
    return (v: T) => { setTouched(true); setter(v) }
  }

  function reset() {
    setInitial(100000); setFinal(350000); setYears(5); setTouched(false)
  }

  const res = useMemo(() => {
    if (initial <= 0 || years <= 0) return { cagr: 0, totalReturns: 0, profit: 0 }
    const cagr = (Math.pow(final / initial, 1 / years) - 1) * 100
    return { cagr, totalReturns: (final - initial) / initial * 100, profit: final - initial }
  }, [initial, final, years])

  const chartData = useMemo(() => {
    const labels: string[] = [], compound: number[] = [], simple: number[] = []
    for (let y = 0; y <= years; y++) {
      labels.push(`Yr ${y}`)
      compound.push(initial * Math.pow(1 + res.cagr / 100, y))
      simple.push(initial + (final - initial) * (y / years))
    }
    return { labels, compound, simple }
  }, [initial, final, years, res.cagr])

  const copyText = `CAGR Calculator\nInitial: ${fmtINR(initial)} → Final: ${fmtINR(final)}\nDuration: ${years} years\nCAGR: ${fmtPct(res.cagr)}\nTotal Returns: ${fmtPct(res.totalReturns)}\nProfit: ${fmtINR(res.profit)}`

  return (
    <CalcShell
      inputs={
        <>
          <SectionTitle>CAGR Calculator</SectionTitle>
          <SliderRow label="Initial Investment" value={initial}
            min={1000} max={10000000} step={1000} onChange={touch(setInitial)} prefix="₹" />
          <SliderRow label="Final Value" value={final}
            min={1000} max={50000000} step={1000}
            onChange={v => { setTouched(true); setFinal(Math.max(initial, v)) }} prefix="₹" />
          <SliderRow label="Investment Duration" value={years}
            min={1} max={40} step={1} onChange={touch(setYears)} display={`${years} yrs`} />

          {touched && (
            <div style={{ background: 'rgba(74,122,74,0.08)', borderRadius: 10,
              padding: '12px 14px', border: '1px solid rgba(74,122,74,0.2)' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>Quick Summary</div>
              <div style={{ fontSize: 12, color: 'var(--text-sm)', lineHeight: 1.7 }}>
                {fmtCompact(initial)} grew to {fmtCompact(final)}<br />
                in {years} years =&nbsp;
                <strong style={{ color: 'var(--green)' }}>{fmtPct(res.cagr)} CAGR</strong>
              </div>
            </div>
          )}

          <button onClick={reset}
            style={{ background: 'none', border: '1px solid var(--border)',
              borderRadius: 20, padding: '6px 18px', fontSize: 11, color: 'var(--muted)',
              cursor: 'pointer', fontFamily: 'Inter,sans-serif', alignSelf: 'flex-start' }}>
            Reset
          </button>
        </>
      }
      results={
        <>
          {!touched ? <UntouchedHint /> : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <ResultCard label="CAGR"           value={fmtPct(res.cagr)}           accent="var(--gold)"  large />
                <ResultCard label="Absolute Profit" value={fmtCompact(res.profit)}     accent="var(--green)" large />
                <ResultCard label="Total Returns"   value={fmtPct(res.totalReturns)}   accent="var(--text)" />
                <ResultCard label="Final Value"     value={fmtCompact(final)}           accent="var(--muted)" />
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '16px 16px 8px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>Investment Growth Chart</div>
                <LineChart
                  series={[
                    { data: chartData.compound, color: '#B8924A', label: 'Compound' },
                    { data: chartData.simple,   color: '#7A6E5F', label: 'Simple',  dashed: true },
                  ]}
                  xLabels={chartData.labels} gradientId="cagr" />
                <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
                  {[{ c: '#B8924A', l: 'Compound' }, { c: '#7A6E5F', l: 'Simple' }].map(({ c, l }) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--muted)' }}>
                      <div style={{ width: 16, height: 2, background: c, borderRadius: 1 }} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <CopyBtn text={copyText} disabled={!touched} />
              </div>
            </>
          )}
        </>
      }
    />
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type CalcTab = 'investment' | 'goal' | 'fire' | 'inflation' | 'cagr'

const CALC_TABS: { key: CalcTab; label: string; icon: string; desc: string }[] = [
  { key: 'investment', label: 'Investment',   icon: '📈', desc: 'SIP · Step-up · Lumpsum' },
  { key: 'goal',       label: 'Goal Planner', icon: '🎯', desc: 'Monthly SIP for any goal' },
  { key: 'fire',       label: 'FIRE',         icon: '🔥', desc: 'Financial Independence'  },
  { key: 'inflation',  label: 'Inflation',    icon: '📉', desc: 'Purchasing power erosion' },
  { key: 'cagr',       label: 'CAGR',         icon: '📊', desc: 'Compound annual growth'  },
]

export default function CalculatorsPage() {
  const [activeCalc, setActiveCalc] = useState<CalcTab>('investment')

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter,sans-serif' }}>
      <style>{CSS}</style>
      <DNavbar activeTab="Calculators" />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 80px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase',
            letterSpacing: '0.09em', marginBottom: 6 }}>
            Financial Tools
          </div>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 26,
            fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Calculators
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-sm)' }}>
            Plan smarter — simulate SIPs, goals, FIRE, inflation, and returns instantly.
          </p>
        </div>

        {/* Calculator selector tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          {CALC_TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveCalc(tab.key)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: 2, padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
              background: activeCalc === tab.key ? 'var(--gold)' : 'var(--surface)',
              border: `1px solid ${activeCalc === tab.key ? 'var(--gold)' : 'var(--border)'}`,
              color: activeCalc === tab.key ? '#fff' : 'var(--text)',
              fontFamily: 'Inter,sans-serif',
              boxShadow: activeCalc === tab.key ? '0 2px 8px rgba(184,146,74,0.3)' : 'none',
              transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{tab.icon} {tab.label}</div>
              <div style={{ fontSize: 10,
                color: activeCalc === tab.key ? 'rgba(255,255,255,0.75)' : 'var(--muted)' }}>
                {tab.desc}
              </div>
            </button>
          ))}
        </div>

        <div className="calc-enter" key={activeCalc}>
          {activeCalc === 'investment' && <InvestmentCalc />}
          {activeCalc === 'goal'       && <GoalCalc />}
          {activeCalc === 'fire'       && <FireCalc />}
          {activeCalc === 'inflation'  && <InflationCalc />}
          {activeCalc === 'cagr'       && <CagrCalc />}
        </div>
      </div>
    </main>
  )
}
