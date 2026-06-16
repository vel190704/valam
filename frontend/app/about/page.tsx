import InfoPageSection from '@/components/sections/InfoPageSection'

export default function AboutPage() {
  return (
    <InfoPageSection
      eyebrow="About Valam"
      title="A guided path for everyday wealth decisions."
      body="Valam helps people understand where they stand financially and what practical step comes next."
      points={[
        'Simple assessment flow for income, savings, investments, and experience.',
        'A VALAM level that turns scattered financial inputs into a clear stage.',
        'Roadmaps designed around Indian investment habits and goals.',
        'A dashboard that keeps your profile and recommendations in one place.',
      ]}
    />
  )
}
