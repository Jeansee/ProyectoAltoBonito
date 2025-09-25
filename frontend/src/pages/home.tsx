import React from "react";
import HeroSlider from "../components/home/carousel";
import AboutSection from "../components/home/nosotros";
import ServicesSection from "../components/home/servicios";
import Galeria from "../components/home/galeria";

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
