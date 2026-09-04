import { Metadata } from 'next'
import { AboutContent } from '@/components/about/AboutContent'

export const metadata: Metadata = {
  title: 'About Hadiyyati | هديتي',
  description:
    'Hadiyyati (هديتي) is an Arab World-focused gifting platform. You wish. They give. You get exactly what you wanted.',
}

export default function AboutPage() {
  return <AboutContent />
}
