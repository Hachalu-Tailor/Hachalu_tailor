import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineScissors,
  HiOutlineGlobeAlt,
  HiOutlineShieldCheck,
  HiArrowLongRight
} from 'react-icons/hi2';
import { getSuitTypes, getMaterials } from '../api/api';
import { IMAGES } from '../constants/images';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const [suitTypesRes, materialsRes] = await Promise.all([
        getSuitTypes(),
        getMaterials()
      ]);

      // Handle paginated responses
      let suitTypes = suitTypesRes.data;
      if (suitTypes && typeof suitTypes === 'object' && !Array.isArray(suitTypes)) {
        suitTypes = suitTypes.results || suitTypes.data || suitTypes.items || [];
      }

      let materials = materialsRes.data;
      if (materials && typeof materials === 'object' && !Array.isArray(materials)) {
        materials = materials.results || materials.data || materials.items || [];
      }

      // Create services from API data
      const servicesData = [
        {
          id: "01",
          title: "Bespoke Tailoring",
          desc: "The pinnacle of the Hachalu experience. A garment crafted from a unique pattern, hand-cut and sewn to your exact specifications.",
          features: [`${suitTypes?.length || 0}+ Suit Types`, "Infinite fabric selection", "Lifetime adjustments"],
          icon: <HiOutlineScissors size={32} />,
          img: IMAGES.SERVICES.HERO1,
        },
        {
          id: "02",
          title: "Virtual Atelier",
          desc: "Experience luxury from your home. Our measurement suite ensures a flawless fit, no matter where you are.",
          features: ["AI Body Scanning", "1-on-1 Stylist Call", "Digital Fabric Swatches"],
          icon: <HiOutlineGlobeAlt size={32} />,
          img: IMAGES.SERVICES.HERO2,
        },
        {
          id: "03",
          title: "The Restoration",
          desc: "A garment from Hachalu is a lifetime investment. We provide full restoration and reinforcement services.",
          features: ["Original Thread Match", "Structural Cleaning", "Archival Storage"],
          icon: <HiOutlineShieldCheck size={32} />,
          img: IMAGES.SERVICES.HERO4
        }
      ];

      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const servicesData = services.length > 0 ? services : [
    {
      id: "01",
      title: "Bespoke Tailoring",
      desc: "The pinnacle of the Hachalu experience. A garment crafted from a unique pattern, hand-cut and sewn to your exact anatomical specifications by our Master Tailors.",
      features: ["40+ Hand-stitched hours", "Infinite fabric selection", "Lifetime adjustments"],
      icon: <HiOutlineScissors size={32} />,
      img: IMAGES.SERVICES.HERO1,
    },
    {
      id: "02",
      title: "Virtual Atelier",
      desc: "Experience global luxury from your home. Our AI-driven measurement suite and virtual stylists ensure a flawless fit, no matter where you are in the world.",
      features: ["AI Body Scanning", "1-on-1 Stylist Call", "Digital Fabric Swatches"],
      icon: <HiOutlineGlobeAlt size={32} />,
      img: IMAGES.SERVICES.HERO2,
    },
    {
      id: "03",
      title: "The Restoration",
      desc: "A garment from Hachalu is a lifetime investment. We provide full restoration, lining replacement, and structural reinforcement services for all our historical pieces.",
      features: ["Original Thread Match", "Structural Cleaning", "Archival Storage"],
      icon: <HiOutlineShieldCheck size={32} />,
      img: IMAGES.SERVICES.HERO4
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-500 pb-20">

      {/* HERO SECTION */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.SERVICES.HERO3}
            className="w-full h-full object-cover opacity-20 dark:opacity-10"
            alt="Atelier"
          />
        </div>
        <div className="relative z-10 text-center px-6">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-600 font-black tracking-[0.5em] uppercase text-xs"
          >
            The Protocol Experience
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-black text-black dark:text-white uppercase tracking-tighter mt-4"
          >
            Our Services
          </motion.h1>
        </div>
      </section>

      {/* SERVICES LIST */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-20 space-y-40">
        {servicesData.map((service, index) => (
          <div
            key={service.id}
            className={`flex flex-col lg:flex-row items-center gap-16 ${index % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}
          >
            {/* Image Side */}
            <div className="w-full lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative aspect-[4/5] overflow-hidden"
              >
                <img src={service.img} className="w-full h-full object-cover hover:grayscale-0 transition-all duration-1000" alt="" />
                <div className="absolute top-0 left-0 bg-red-600 text-white p-6 font-black text-2xl">
                  {service.id}
                </div>
              </motion.div>
            </div>

            {/* Text Side */}
            <div className="w-full lg:w-1/2 space-y-8">
              <div className="text-red-600 mb-4">{service.icon}</div>
              <h2 className="text-4xl md:text-5xl font-black text-black dark:text-white uppercase tracking-tight">
                {service.title}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed italic">
                "{service.desc}"
              </p>

              <ul className="space-y-4 pt-6">
                {service.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-black dark:text-white">
                    <div className="h-1 w-6 bg-red-600" /> {feat}
                  </li>
                ))}
              </ul>

              <button className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] pt-8 hover:text-red-600 transition-colors group">
                Inquire Service <HiArrowLongRight className="group-hover:translate-x-3 transition-transform" size={24} />
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* PROCESS SECTION (Mood Maker) */}
      <section className="mt-40 bg-gray-50 dark:bg-[#0c0c0c] py-32 px-6 lg:px-20">
        <div className="max-w-[1440px] mx-auto">
          <h3 className="text-center text-black dark:text-white font-black uppercase text-xs tracking-[0.5em] mb-20">The Craftsmanship Journey</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <ProcessStep num="01" title="Consult" desc="Initial design and silhouette discussion." />
            <ProcessStep num="02" title="Measure" desc="Precise 32-point anatomical mapping." />
            <ProcessStep num="03" title="Baste" desc="First assembly for structural fitting." />
            <ProcessStep num="04" title="Finish" desc="Final hand-stitching and detailing." />
          </div>
        </div>
      </section>
    </div>
  );
};

const ProcessStep = ({ num, title, desc }) => (
  <div className="space-y-4 border-l border-gray-200 dark:border-white/10 pl-8">
    <span className="text-red-600 font-black text-xs uppercase tracking-widest">{num}</span>
    <h4 className="text-black dark:text-white font-black uppercase text-sm tracking-widest">{title}</h4>
    <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed uppercase tracking-tighter">{desc}</p>
  </div>
);

export default Services;
