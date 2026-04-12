import React from 'react';
import { 
  FaInstagram, 
  FaFacebookF, 
  FaTelegramPlane, 
  FaYoutube, 
  FaCcVisa, 
  FaCcMastercard, 
  FaCcApplePay, 
  FaCcPaypal 
} from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Update these with your real usernames/links
  const socialLinks = [
    { name: 'Telegram', Icon: FaTelegramPlane, url: 'https://t.me/HachaluProtocol' },
    { name: 'Facebook', Icon: FaFacebookF, url: 'https://facebook.com/HachaluProtocol' },
    { name: 'Instagram', Icon: FaInstagram, url: 'https://instagram.com/HachaluProtocol' },
    { name: 'YouTube', Icon: FaYoutube, url: 'https://youtube.com/@HachaluProtocol' },
  ];

  return (
    <footer className="bg-white dark:bg-[#080808] border-t border-gray-100 dark:border-white/5 pt-20">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-16">
        
        {/* TOP SECTION: NEWSLETTER & BRAND */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-16 border-b border-gray-100 dark:border-white/5">
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter">
              HACHALU PROTOCOL
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs tracking-[0.2em] uppercase max-w-sm leading-relaxed">
              Precision tailoring meets heritage craftsmanship. Join the elite archive for collection drops.
            </p>
          </div>
          <div className="flex flex-col lg:items-end justify-center space-y-8">
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <SocialLink key={social.name} Icon={social.Icon} url={social.url} />
              ))}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">
                Headquarters
              </p>
              <p className="text-[11px] text-black dark:text-white font-black uppercase tracking-widest mt-1">
                Shashemene, Ethiopia
              </p>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: NAVIGATION GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 py-20">
          <FooterColumn 
            title="Catalogue" 
            links={[
              { label: "All Items", href: "/items" },
              { label: "New Arrivals", href: "/items" },
              { label: "Bespoke Service", href: "/bespoke" },
              { label: "Accessories", href: "/items" }
            ]} 
          />
          <FooterColumn 
            title="Service" 
            links={[
              { label: "Measurement Guide", href: "#" },
              { label: "Shipping Policy", href: "#" },
              { label: "Order Status", href: "#" },
              { label: "Returns", href: "#" }
            ]} 
          />
          <FooterColumn 
            title="The Brand" 
            links={[
              { label: "Our Story", href: "#" },
              { label: "Sustainability", href: "#" },
              { label: "Careers", href: "#" },
              { label: "Journal", href: "#" }
            ]} 
          />
          <div className="space-y-6">
            <h4 className="text-black dark:text-white font-black text-[11px] uppercase tracking-[0.3em]">Direct Contact</h4>
            <div className="space-y-4">
              <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest leading-loose">
                01, Biftu<br />
                Shashemene, Ethiopia
              </p>
              <a href="mailto:support@hachalu.com" className="block text-red-600 text-[10px] font-black uppercase tracking-widest hover:underline">
                support@hachalu.com
              </a>
              <p className="text-black dark:text-white text-[10px] font-black uppercase tracking-widest">
                +251 911 00 00 00
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: BASEMENT */}
        <div className="py-12 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Payment Icons */}
          {/* <div className="flex gap-6 opacity-30 hover:opacity-100 transition-opacity duration-500">
            <FaCcVisa size={22} className="dark:text-white" />
            <FaCcMastercard size={22} className="dark:text-white" />
            <FaCcApplePay size={22} className="dark:text-white" />
            <FaCcPaypal size={22} className="dark:text-white" />
          </div> */}

          {/* Copyright */}
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.5em] text-center">
            © {currentYear} HACHALU PROTOCOL. CRAFTED IN SHASHEMENE.
          </p>

          {/* Legal */}
          <div className="flex gap-8">
            <a href="#" className="text-[9px] text-gray-400 font-bold uppercase tracking-widest hover:text-red-600 transition-colors">Privacy Policy</a>
            <a href="#" className="text-[9px] text-gray-400 font-bold uppercase tracking-widest hover:text-red-600 transition-colors">Terms of Sale</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* --- CLEAN HELPER COMPONENTS --- */

const FooterColumn = ({ title, links }) => (
  <div className="space-y-6">
    <h4 className="text-black dark:text-white font-black text-[11px] uppercase tracking-[0.3em]">
      {title}
    </h4>
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link.label}>
          <a 
            href={link.href} 
            className="text-gray-500 hover:text-red-600 text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 block"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const SocialLink = ({ Icon, url }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="h-12 w-12 flex items-center justify-center border border-gray-100 dark:border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all duration-300 transform hover:-translate-y-1"
  >
    <Icon size={18} />
  </a>
);

export default Footer;