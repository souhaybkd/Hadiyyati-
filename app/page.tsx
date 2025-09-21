import {
  Hero,
  HowItWorks,
  Features,
  Benefits,
  Pricing,
  
  CTA,
  Share,
  Testimonials,
  
  FAQ,
  BilingualFeature,
} from '@/components/home'

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <Benefits />
      <Pricing />

      <Testimonials />
      
      <BilingualFeature />
      <Share />
      <FAQ />
      <CTA />
    </>
  )
} 