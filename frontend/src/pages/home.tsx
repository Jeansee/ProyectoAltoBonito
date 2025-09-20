import React from "react";
import HeroSlider from "../components/carousel";
import AboutSection from "../components/nosotros";
import ServicesSection from "../components/servicios";
import Galeria from "../components/galeria";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#eaeaea]">
      <div className="pt-6">
        <HeroSlider />
      </div>

      {/* Nueva sección “Sobre nosotros” */}
      <AboutSection />
      <ServicesSection />
      <Galeria />
    </div>
  );
}
