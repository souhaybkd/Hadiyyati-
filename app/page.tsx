import {
  Hero,
  HowItWorks,
  Features,
  Benefits,
  Pricing,
  
  CTA,
  Share,
  
  FAQ,
  BilingualFeature,
} from '@/components/home'

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Pattern background on the right side - Desktop only, highest z-index */}
      <div 
        className="hidden lg:block fixed right-0 top-0 bottom-0 w-64 pointer-events-none z-[40] opacity-100"
        style={{
          backgroundImage: 'url(/assets/img/pattern.png)',
          backgroundRepeat: 'repeat-y',
          backgroundPosition: 'right top',
          backgroundSize: 'auto',
        }}
      />
      
      {/* Content wrapper with relative positioning */}
      <div className="relative z-10">
        <Hero />
        <HowItWorks />
        <Features />
        <Benefits />
        <Pricing />

        {/* <Testimonials /> */}
        
        <BilingualFeature />
        <Share />
        <FAQ />
        <CTA />
      </div>
    </div>
  )
} 