// const BASE_URL = "https://raw.githubusercontent.com/YOUR_USERNAME/hachalu-assets/main";
  const BASE_URL = "https://cdn.jsdelivr.net/gh/USER/REPO@main/img.jpg";
                    

export const IMAGES = {
  logos: {
    main: `${BASE_URL}/logos/logo-main.png`,
  },
  services: {
    offer: `${BASE_URL}/services/we-offer.jpg`,
    discount: `${BASE_URL}/services/discount.jpg`,
  },
  shop: {
    men: [
      { id: 1, url: `${BASE_URL}/shop/men/suit-01.webp`, name: "Protocol Suit" },
    ],
    women: [
      { id: 1, url: `${BASE_URL}/shop/women/dress-01.webp`, name: "Silk Dress" },
    ]
  }
};