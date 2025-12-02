import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { ExamplesSection } from './ExamplesSection';
import { CTASection } from './CTASection';
import { Footer } from './Footer';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export function LandingPage({ onLaunchApp }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar onLaunchApp={onLaunchApp} />
      <HeroSection onLaunchApp={onLaunchApp} />
      <FeaturesSection />
      <HowItWorksSection />
      <ExamplesSection />
      <CTASection onLaunchApp={onLaunchApp} />
      <Footer />
    </div>
  );
}
