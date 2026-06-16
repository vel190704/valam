import InfoPageSection from '@/components/sections/InfoPageSection'

export default function ContactPage() {
  return (
    <InfoPageSection
      eyebrow="Contact"
      title="Have a question or idea for Valam?"
      body="Use this page as the future home for support, feedback, partnerships, and product questions."
      points={[
        'Support: help users with login, profile, and dashboard issues.',
        'Feedback: collect suggestions for improving recommendations.',
        'Partnerships: connect with educators, planners, or fintech teams.',
        'Product: track what users want next from the Valam journey.',
      ]}
    />
  )
}
