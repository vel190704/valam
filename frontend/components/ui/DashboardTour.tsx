'use client'
import { useState, useEffect, RefObject } from 'react'
import { useRouter } from 'next/navigation'

interface TourStep {
  ref: RefObject<HTMLDivElement | null>
  title: string
  emoji: string
  body: string
  disclaimer?: string
}

interface DashboardTourProps {
  steps: TourStep[]
  onComplete: () => void
  onSkip: () => void
}

export default function DashboardTour({ steps, onComplete, onSkip }: DashboardTourProps) {
  const [step, setStep] = useState(0)
  const [box, setBox] = useState<DOMRect | null>(null)
  const router = useRouter()
  const current = steps[step]
  const isLast = step === steps.length - 1

  useEffect(() => {
    function calcBox() {
      if (current?.ref?.current) {
        const rect = current.ref.current.getBoundingClientRect()
        setBox(rect)
        current.ref.current.scrollIntoView({
          behavior: 'smooth', block: 'center'
        })
      }
    }
    calcBox()
    window.addEventListener('resize', calcBox)
    return () => window.removeEventListener('resize', calcBox)
  }, [step, current])

  function next() {
    if (isLast) {
      onComplete()
    } else {
      setStep(s => s + 1)
    }
  }

  const PADDING = 8

  return (
    <>
      {/* Dark overlay — blocks interaction with rest of page */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(2px)',
        pointerEvents: 'all',
      }} onClick={e => e.stopPropagation()} />

      {/* Spotlight cutout — transparent window over the active card */}
      {box && (
        <div style={{
          position: 'fixed',
          top:    box.top    - PADDING,
          left:   box.left   - PADDING,
          width:  box.width  + PADDING * 2,
          height: box.height + PADDING * 2,
          zIndex: 1001,
          borderRadius: 22,
          boxShadow: `
            0 0 0 9999px rgba(0,0,0,0.72),
            0 0 0 3px var(--gold),
            0 0 24px 4px rgba(184,146,74,0.45)
          `,
          pointerEvents: 'none',
        }} />
      )}

      {/* Tooltip popup */}
      {box && (
        <div style={{
          position: 'fixed',
          top: Math.min(
            box.bottom + PADDING + 16,
            window.innerHeight - 260
          ),
          left: Math.max(16, Math.min(
            box.left,
            window.innerWidth - 380
          )),
          width: 360,
          zIndex: 1002,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px 22px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
          fontFamily: 'Inter, sans-serif',
        }}>
          {/* Step indicator */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 12,
          }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {steps.map((_, i) => (
                <div key={i} style={{
                  width: i === step ? 20 : 6, height: 6,
                  borderRadius: 3,
                  background: i === step ? 'var(--gold)'
                    : i < step ? 'var(--gold-lt)' : 'var(--surface2)',
                  transition: 'width 0.2s, background 0.2s',
                }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {step + 1} / {steps.length}
            </div>
          </div>

          {/* Title */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 8, marginBottom: 10,
          }}>
            <span style={{ fontSize: 20 }}>{current.emoji}</span>
            <div style={{
              fontSize: 15, fontWeight: 700,
              color: 'var(--text)',
            }}>{current.title}</div>
          </div>

          {/* Body */}
          <div style={{
            fontSize: 13, color: 'var(--text-sm)',
            lineHeight: 1.65, marginBottom: current.disclaimer ? 10 : 18,
          }}>
            {current.body}
          </div>

          {/* Optional disclaimer */}
          {current.disclaimer && (
            <div style={{
              fontSize: 11, color: 'var(--muted)',
              lineHeight: 1.55,
              background: 'var(--surface2)',
              borderRadius: 8, padding: '7px 10px',
              marginBottom: 16,
              borderLeft: '3px solid var(--gold)',
            }}>
              🔒 {current.disclaimer}
            </div>
          )}

          {/* Buttons */}
          <div style={{
            display: 'flex', gap: 10,
            justifyContent: 'space-between', alignItems: 'center',
          }}>
            <button
              onClick={onSkip}
              style={{
                background: 'none', border: 'none',
                fontSize: 12, color: 'var(--muted)',
                cursor: 'pointer', padding: '6px 4px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Skip tour
            </button>

            {isLast ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { onComplete(); router.push('/learning') }}
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 8, padding: '8px 14px',
                    fontSize: 12, color: 'var(--text)',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                  }}
                >
                  Open Learning Hub →
                </button>
                <button
                  onClick={onComplete}
                  style={{
                    background: 'var(--gold)',
                    border: 'none', borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: 12, color: '#1A0F0A',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                  }}
                >
                  Done ✓
                </button>
              </div>
            ) : (
              <button
                onClick={next}
                style={{
                  background: 'var(--gold)',
                  border: 'none', borderRadius: 8,
                  padding: '8px 20px',
                  fontSize: 12, color: '#1A0F0A',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                }}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
