'use client'

export type DisclaimerVariant = 'compact' | 'full' | 'banner'

interface DisclaimerProps {
  variant?: DisclaimerVariant
  className?: string
}

const LEGAL_TEXT = {
  short: 'For educational purposes only. Not investment advice. Investments subject to market risk.',
  full: 'Educational Reference Only — VALAM is not a SEBI-registered Investment Adviser (RIA) under the SEBI (Investment Advisers) Regulations, 2013. All content, scores, roadmaps, allocation suggestions, and AI-generated insights on this platform are for financial education and self-awareness purposes only. Nothing on VALAM constitutes investment advice, a solicitation, or a recommendation to buy, sell, or hold any financial product or security. Past performance of any asset class does not guarantee future results. Investments are subject to market risks — please read all scheme-related documents carefully before investing. Consult a SEBI-registered Investment Adviser before making investment decisions.',
}

export default function Disclaimer({ variant = 'compact' }: DisclaimerProps) {
  if (variant === 'banner') {
    return (
      <div style={{
        background: 'rgba(184,146,74,0.06)',
        border: '1px solid rgba(184,146,74,0.2)',
        borderRadius: 10,
        padding: '10px 16px',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        margin: '12px 0',
      }}>
        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚖️</span>
        <div>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--gold)',
            letterSpacing: '.4px',
            textTransform: 'uppercase',
            marginBottom: 3,
          }}>
            Educational Reference Only
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
            VALAM is not a SEBI-registered Investment Adviser. Insights and suggestions are for
            educational purposes only and do not constitute investment advice or a recommendation
            to buy or sell any financial product. Investments are subject to market risks.
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '16px 0 0',
        margin: '16px 0 0',
      }}>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--muted)',
          letterSpacing: '.4px',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          ⚖️ Legal Disclaimer
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}>
          {LEGAL_TEXT.full}
        </div>
      </div>
    )
  }

  // compact (default)
  return (
    <div style={{
      fontSize: 10,
      color: 'var(--muted)',
      lineHeight: 1.6,
      padding: '6px 0',
      borderTop: '1px solid var(--border)',
      marginTop: 8,
    }}>
      ⚖️ {LEGAL_TEXT.short}
    </div>
  )
}
