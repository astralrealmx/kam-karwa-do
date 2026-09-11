import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { AudienceSplit } from "@/components/home/AudienceSplit";
import { PopularCategories } from "@/components/home/PopularCategories";
import { TrustSafety } from "@/components/home/TrustSafety";
import { FaqPreview } from "@/components/home/FaqPreview";
import { FinalCta } from "@/components/home/FinalCta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <AudienceSplit />
      <PopularCategories />
      <TrustSafety />
      <FaqPreview />
      <FinalCta />
    </>
  );
}
