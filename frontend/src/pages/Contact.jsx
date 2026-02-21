import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser'; // Import EmailJS
import {  
  HiOutlineEnvelope, // Fixed your icon import
  HiOutlinePhone, 
  HiOutlineMapPin, 
  HiOutlineGlobeAlt,
  HiOutlineChatBubbleLeftRight 
} from 'react-icons/hi2';

const Contact = () => {
  const formRef = useRef();
  const [isSending, setIsSending] = useState(false);
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSending(true);

    // --- EMAILJS CONFIGURATION ---
    // Replace these strings with your actual IDs from EmailJS dashboard
    const SERVICE_ID = "service_lja2ayl"; 
    const TEMPLATE_ID = "template_e76hyue";
    const PUBLIC_KEY = "kSx08USkdx0tilF12";

    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, PUBLIC_KEY)
      .then((result) => {
          console.log(result.text);
          alert("Message sent successfully! We will get back to you soon.");
          setFormState({ name: '', email: '', message: '' }); // Clear form
      }, (error) => {
          console.log(error.text);
          alert("Failed to send message. Please try again or call us directly.");
      })
      .finally(() => {
          setIsSending(false);
      });
  };

  return (
    <section id="contact" className="min-h-screen bg-white dark:bg-[#080808] pt-32 pb-20 overflow-x-hidden">
      <div className="lg:px-12 max-w-[1600px] mx-auto">
        
        {/* HEADER */}
        <div className="mb-20 px-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start px-4">
          
          {/* LEFT: MAP */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="relative group overflow-hidden bg-zinc-100 dark:bg-zinc-900 aspect-square md:aspect-video lg:aspect-square">
              <div className="absolute inset-0 group-hover:grayscale-0 transition-all duration-1000">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15848.33089422033!2d38.5874251!3d7.197063!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x17b3d34484081efb%3A0xc0f69915c2670e34!2sShashamane!5e0!3m2!1sen!2set!4v1700000000000" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy"
                  title="Hachalu Protocol Location"
                ></iframe>
              </div>
              
              <div className="absolute bottom-6 left-6 right-6 bg-white dark:bg-zinc-950 p-6 shadow-2xl border-l-4 border-red-600 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <h4 className="font-black uppercase text-xs tracking-widest mb-1 dark:text-white">Headquarters</h4>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Shashamane City, 01 / Biftu, <br />
                  Ethiopia
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
            {/* Added Ref and Name attributes for EmailJS */}
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest dark:text-gray-400">Full Name</label>
                  <input 
                    required
                    name="name" // Matches {{name}} in EmailJS template
                    value={formState.name}
                    onChange={handleChange}
                    type="text" 
                    className="w-full bg-gray-50 dark:bg-zinc-900 border-none p-4 focus:ring-2 focus:ring-red-600 transition-all dark:text-white outline-none" 
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest dark:text-gray-400">Email Address</label>
                  <input 
                    required
                    name="email" // Matches {{email}} in EmailJS template
                    value={formState.email}
                    onChange={handleChange}
                    type="email" 
                    className="w-full bg-gray-50 dark:bg-zinc-900 border-none p-4 focus:ring-2 focus:ring-red-600 transition-all dark:text-white outline-none" 
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest dark:text-gray-400">Message</label>
                <textarea 
                  required
                  name="message" // Matches {{message}} in EmailJS template
                  value={formState.message}
                  onChange={handleChange}
                  rows="5" 
                  className="w-full bg-gray-50 dark:bg-zinc-900 border-none p-4 focus:ring-2 focus:ring-red-600 transition-all dark:text-white outline-none" 
                  placeholder="How can Hachalu Protocol help you?"
                ></textarea>
              </div>
              <button 
                disabled={isSending}
                type="submit"
                className={`w-full md:w-auto bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs px-12 py-5 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${isSending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white'}`}
              >
                {isSending ? 'Transmitting...' : 'Send Message'}
              </button>
            </form>

            {/* QUICK CONTACT INFO CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className=''>
                <ContactMethod icon={<HiOutlinePhone/>} label="" detail="+251900000095" />
                <ContactMethod icon={<HiOutlinePhone/>} label="" detail="+251900000095" />
              </div>
              
              <ContactMethod icon={<HiOutlineEnvelope/>} label="Email" detail="info@ndm.com" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

// HELPER COMPONENTS
const ContactMethod = ({ icon, label, detail }) => (
  <div className="p-6 bg-gray-50 dark:bg-zinc-900 flex items-center gap-4 group hover:bg-red-600 transition-colors duration-500">
    <div className="text-red-600 group-hover:text-white transition-colors">{React.cloneElement(icon, { size: 24 })}</div>
    <div className="text-left">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-red-200">{label}</p>
      <p className="text-sm font-bold dark:text-white group-hover:text-white">{detail}</p>
    </div>
  </div>
);

export default Contact;