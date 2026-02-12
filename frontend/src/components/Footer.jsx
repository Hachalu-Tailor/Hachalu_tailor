import React from 'react';
import { 
  FaInstagram, FaTwitter, FaFacebookF, FaYoutube, 
  FaCcVisa, FaCcMastercard, FaCcApplePay, FaCcPaypal 
} from 'react-icons/fa';
import { HiOutlineArrowRight } from 'react-icons/hi2';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-brand-dark pt-20 border-t border-gray-100 dark:border-white/5">
      <div className="max-w-360 mx-auto px-6 lg:px-16">
        
        {/* TOP SECTION: NEWSLETTER & BRAND */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-16 border-b border-gray-100 dark:border-white/5">
          <div className="space-y-6">
            <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter">
              HACHALU PROTOCOL
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs tracking-widest uppercase max-w-sm leading-relaxed">
              Subscribe for exclusive collection updates and tailoring events.
            </p>
            <div className="relative max-w-md">
              <input 
                type="email" 
                placeholder="YOUR EMAIL" 
                className="w-full bg-transparent border-b border-gray-300 dark:border-white/10 py-3 text-[10px] font-bold tracking-widest focus:border-red-600 outline-none transition-all dark:text-white"
              />
              <button className="absolute right-0 bottom-3 text-black dark:text-white hover:text-red-600 transition-colors">
                <HiOutlineArrowRight size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:items-end justify-end space-y-6">
            <div className="flex gap-4">
              <SocialLink Icon={FaInstagram} />
              <SocialLink Icon={FaTwitter} />
              <SocialLink Icon={FaFacebookF} />
              <SocialLink Icon={FaYoutube} />
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Based in Adama(Nazerit), Ethiopia</p>
          </div>
        </div>

        {/* MIDDLE SECTION: NAVIGATION GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 py-16">
          <FooterColumn 
            title="Shop" 
            links={["All Items", "New Arrivals", "Bespoke", "Accessories"]} 
          />
          <FooterColumn 
            title="Support" 
            links={["Order Status", "Shipping", "Returns", "Size Guide"]} 
          />
          <FooterColumn 
            title="Company" 
            links={["About Us", "Sustainability", "Careers", "Journal"]} 
          />
          <div className="space-y-4">
            <h4 className="text-black dark:text-white font-black text-[11px] uppercase tracking-[0.3em]">Contact</h4>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest leading-loose">
              Posta Road, Ward 03<br />
              Adma(Nazerit), Ethiopia<br />
              support@hachalu.com
            </p>
          </div>
        </div>

        {/* BOTTOM SECTION: BASEMENT */}
        <div className="py-10 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Payment Icons */}
          <div className="flex gap-5 opacity-40 hover:opacity-100 transition-opacity">
            <FaCcVisa size={24} className="dark:text-white" />
            <FaCcMastercard size={24} className="dark:text-white" />
            <FaCcApplePay size={24} className="dark:text-white" />
            <FaCcPaypal size={24} className="dark:text-white" />
          </div>

          {/* Copyright */}
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.4em]">
            © {currentYear} HACHALU PROTOCOL. ALL RIGHTS RESERVED.
          </p>

          {/* Legal */}
          <div className="flex gap-6">
            <a href="#" className="text-[9px] text-gray-400 font-bold uppercase tracking-widest hover:text-red-600 transition-colors">Privacy</a>
            <a href="#" className="text-[9px] text-gray-400 font-bold uppercase tracking-widest hover:text-red-600 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* --- CLEAN HELPER COMPONENTS --- */

const FooterColumn = ({ title, links }) => (
  <div className="space-y-5">
    <h4 className="text-black dark:text-white font-black text-[11px] uppercase tracking-[0.3em]">
      {title}
    </h4>
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link}>
          <a href="#" className="text-gray-500 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest transition-colors">
            {link}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const SocialLink = ({ Icon }) => (
  <a
    href="#"
    className="h-10 w-10 flex items-center justify-center border border-gray-100 dark:border-white/10 rounded-full text-gray-400 hover:text-red-600 hover:border-red-600 transition-all"
  >
    <Icon size={16} />
  </a>
);

export default Footer;