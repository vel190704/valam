import InfoPageSection from '@/components/sections/InfoPageSection'

export default function VisionPage() {
  return (
    <InfoPageSection
      eyebrow="Vision"
      title="Make investing feel understandable, personal, and doable."
      body="The vision is to help more people move from financial confusion to confident, consistent action."
      points={[
        'Personalized guidance without overwhelming jargon.',
        'Progressive levels that make long-term wealth building easier to follow.',
        'Education-first recommendations for safer financial decisions.',
        'A product that grows from assessment into an ongoing money companion.',
      ]}
    />
  )
}
