import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {  
   HiOutlineUser as HiOutlineMail,
  HiOutlinePhone, 
  HiOutlineMapPin, 
  HiOutlineGlobeAlt,
  HiOutlineChatBubbleLeftRight 
} from 'react-icons/hi2';

const Contact = () => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Message sent to NDM Support!");
  };

  return (
    <div id="contact" className="min-h-screen bg-white dark:bg-[#080808] pt-32 pb-20 overflow-x-hidden">
      <div className="lg:px-12">
        
        {/* HEADER */}
        <div className="mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-600 font-black tracking-[0.4em] uppercase text-[10px]"
          >
            Connect With Us
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black dark:text-white uppercase tracking-tighter mt-4"
          >
            Get In <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">Touch</span>
          </motion.h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* LEFT: MAP */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {/* STYLED MAP CONTAINER */}
            <div className="relative group overflow-hidden bg-zinc-100 dark:bg-zinc-900 aspect-square md:aspect-video lg:aspect-square">
              {/* This is a placeholder for a Google Map iframe or a custom styled Mapbox. 
                  For now, it's a visual 'location card' which looks better in high-end design. */}
              <div className="absolute inset-0 grayscale group-hover:grayscale-0 transition-all duration-1000">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15848.54464872353!2d38.5913222!3d7.1909722!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x17b145610852e923%3A0x6a0f44e73f60f64!2sShashemene%2C%20Ethiopia!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy"
                  title="Hachalu Protocol Location"
                ></iframe>
              </div>
              
              {/* Map Overlay Detail */}
              <div className="absolute bottom-6 left-6 right-6 bg-white dark:bg-zinc-950 p-6 shadow-2xl border-l-4 border-red-600 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <h4 className="font-black uppercase text-xs tracking-widest mb-1 dark:text-white">Headquarters</h4>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Shashamane City, Arsi Zone, <br />
                  Oromia State, Ethiopia'
                </p>
                <div className="mt-4 flex gap-3">
                  <a href="#" className="text-red-600 text-[10px] font-black uppercase tracking-tighter hover:underline">Get Directions</a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: CONTACT FORM */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-10"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest dark:text-gray-400">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 dark:bg-zinc-900 border-none p-4 focus:ring-2 focus:ring-red-600 transition-all dark:text-white outline-none" 
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest dark:text-gray-400">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full bg-gray-50 dark:bg-zinc-900 border-none p-4 focus:ring-2 focus:ring-red-600 transition-all dark:text-white outline-none" 
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest dark:text-gray-400">Message</label>
                <textarea 
                  rows="5" 
                  className="w-full bg-gray-50 dark:bg-zinc-900 border-none p-4 focus:ring-2 focus:ring-red-600 transition-all dark:text-white outline-none" 
                  placeholder="How can hachalu Protocol help you?"
                ></textarea>
              </div>
              <button className="w-full md:w-auto bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs px-12 py-5 hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-all shadow-xl active:scale-95">
                Send Message
              </button>
            </form>

            {/* QUICK CONTACT INFO CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ContactMethod icon={<HiOutlinePhone/>} label="Call Us" detail="+251 9xx xxx xxx" />
              <ContactMethod icon={<HiOutlineMail/>} label="Email" detail="info@ndm.com" />
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

// HELPER COMPONENTS
const ContactMethod = ({ icon, label, detail }) => (
  <div className="p-6 bg-gray-50 dark:bg-zinc-900 flex items-center gap-4 group hover:bg-red-600 transition-colors duration-500">
    <div className="text-red-600 group-hover:text-white transition-colors">{React.cloneElement(icon, { size: 24 })}</div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-red-200">{label}</p>
      <p className="text-sm font-bold dark:text-white group-hover:text-white">{detail}</p>
    </div>
  </div>
);

const SocialLink = ({ icon, name, link }) => (
  <div className="flex items-center justify-between group cursor-pointer">
    <div className="flex items-center gap-3">
      <div className="dark:text-white group-hover:text-red-600 transition-colors">{icon}</div>
      <span className="text-xs font-black uppercase tracking-widest dark:text-white">{name}</span>
    </div>
    <span className="text-[10px] text-gray-500 font-bold group-hover:text-red-600 transition-all">{link}</span>
  </div>
);

export default Contact;