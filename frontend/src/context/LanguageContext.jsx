import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
    en: {
        // Navigation
        home: 'Home',
        services: 'Services',
        shop: 'Shop',
        about: 'About',
        login: 'Login',
        logout: 'Logout',
        profile: 'Profile',
        submitPaymentProof: 'Submit Payment Proof',

        // Common
        search: 'Search',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        view: 'View',
        back: 'Back',
        next: 'Next',
        submit: 'Submit',
        loading: 'Loading...',
        noData: 'No data available',

        // Dashboard
        dashboard: 'Dashboard',
        overview: 'Overview',
        analytics: 'Analytics',
        inventory: 'Inventory',
        orders: 'Orders',
        payments: 'Payments',
        clients: 'Clients',
        messages: 'Messages',
        staff: 'Staff',
        settings: 'Settings',

        // Navbar specific
        weOffer: 'We Offer',
        weOfferDesc: 'Authorized Service',
        discountMenu: 'Discount',
        discountMenuDesc: 'Exclusive Loyalty',
        needHelp: 'Need Help',
        needHelpDesc: 'Customer Support',
        shopAll: 'All',
        shopAllDesc: 'All in one',
        shopMen: "Men's",
        shopMenDesc: 'Advanced Male',
        shopChildren: "Children's",
        shopChildrenDesc: 'Quality Children',

        // Status
        pending: 'Pending',
        completed: 'Completed',
        processing: 'Processing',
        delivered: 'Delivered',
        cancelled: 'Cancelled',

        // Messages
        welcome: 'Welcome',
        welcomeMessage: 'Welcome to Hachalu Tailor',
        logoutSuccess: 'Logged out successfully',
        saveSuccess: 'Saved successfully',
        error: 'Error',

        // Profile / Auth
        security: 'Security',
        email: 'Email',
        phone: 'Phone',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        changePassword: 'Change Password',

        // Access
        accessHub: 'Access Hub',
        adminArea: 'Admin Area',
        receptionistArea: 'Reception Area',
        garmentArea: 'Garment Area',
    },
    om: {
        // Navigation
        home: 'Fuula',
        services: 'Tajaajila',
        shop: 'Dura',
        about: "Waa'ee",
        login: 'Seeni',
        logout: 'Ba\'i',
        profile: 'Profaayilii',
        submitPaymentProof: 'Ragaa Kaffaltii Ergi',

        // Common
        search: 'Barreessuu',
        save: 'Keessummee',
        cancel: 'Haqamee',
        delete: 'Huuqqamee',
        edit: 'Yaroo',
        add: 'Iddoo',
        view: 'Ilaali',
        back: 'Duubee',
        next: 'Kan itti aanee',
        submit: 'Kenname',
        loading: 'Waardhanga...',
        noData: 'Ragaan jiraachuu dhiisoo',

        // Dashboard
        dashboard: 'Dashboordii',
        overview: 'Ilaalcha',
        analytics: 'Analyitiksii',
        inventory: 'Madda',
        orders: 'Ajajoota',
        payments: 'Kaffaltii',
        clients: 'Maamiloota',
        messages: 'Ergaa',
        staff: 'Hojjettoota',
        settings: "Qindaa'ina",

        // Navbar specific
        weOffer: 'Tajaajila Kennu',
        weOfferDesc: 'Tajaajila Hayyamame',
        discountMenu: 'Gatii Hir\'ina',
        discountMenuDesc: 'Looyaaltiba Addaa',
        needHelp: 'Gargaarsa Barbaadda',
        needHelpDesc: 'Tajaajila Maamila',
        shopAll: 'Hunda',
        shopAllDesc: 'Hunduma Waliin',
        shopMen: 'Dhiiraf',
        shopMenDesc: 'Faashinii Dhiiraa',
        shopChildren: 'Dargaggoota',
        shopChildrenDesc: 'Faashinii Dargaggoota',

        // Status
        pending: 'Eegame',
        completed: 'Xumuree',
        processing: 'Kajjellame',
        delivered: 'Kenname',
        cancelled: 'Araare',

        // Messages
        welcome: 'Baga nagaan dhufu',
        welcomeMessage: 'Baga nagaan dhufu Hachaloo Taylooritti',
        logoutSuccess: 'Araarameera',
        saveSuccess: 'Keessummee',
        error: 'Yaaddoo',

        // Profile / Auth
        security: 'Nageenya',
        email: 'Imeelii',
        phone: 'Lakkoofsa Bilbila',
        currentPassword: 'Jecha Iccitii Ammayyuu',
        newPassword: 'Jecha Iccitii Haaraa',
        confirmPassword: 'Jecha Iccitii Mirkaneessi',
        changePassword: 'Jecha Iccitii Jijjiiri',

        // Access
        accessHub: 'Mana barnoota',
        adminArea: 'Naannoo Admin',
        receptionistArea: 'Naannoo Reepshoonistii',
        garmentArea: 'Naannoo Tayloorii',
    }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
    }, [language]);

    const t = (key) => {
        return translations[language]?.[key] || translations['en'][key] || key;
    };

    const changeLanguage = (langCode) => {
        if (translations[langCode]) {
            setLanguage(langCode);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export default LanguageContext;
