# Hachalu Protocol tailor

This is the **frontend application** for the Hachalu Protocol Tailor Suite Platform, a custom suit, clothing, and swimwear ordering system. The frontend is built using **React (Vite)** and **Tailwind CSS**, and it communicates with a Django REST API backend.

---

## 🚀 Tech Stack

* **React** (Vite)
* **Tailwind CSS** for styling
* **React Router DOM** for routing
* **Axios** for API requests
* **Context API** for authentication state

---

## 📁 Project Structure

```
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   │
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   │
│   │   ├── assets/              # Images, icons
│   │   ├── api/                 # API calls
│   │   │   ├── axios.js
│   │   │   ├── auth.api.js
│   │   │   ├── products.api.js
│   │   │   ├── orders.api.js
│   │   │   └── payments.api.js
│   │   │
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── MeasurementForm.jsx
│   │   │   └── Modal.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── ProductDetails.jsx
│   │   │   ├── Order.jsx
│   │   │   ├── UploadPayment.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx
│   │   │
│   |   |── features/          # Business logic divided by role
│   │   |   ├── customer/      # Measurement forms, Catalog
│   │   |   ├── receptionist/  # Order approval, payment review
│   │   |   └── admin/         # Analytics, user management
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx
│   │   │   └── DashboardLayout.jsx
│   │   │
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   │
│   │   ├── utils/
│   │   │   └── constants.js
│   │   │
│   │   └── styles/
│   │       └── index.css
│
└── README.md
```

---

## ✨ Features

### 🌐 Public Pages

* Home page with company introduction
* Products listing (suits, clothing, swimwear)
* Product details page
* Services overview

### 👤 Authentication

* receptionist/admin registration/login
* Protected routes
* JWT-based authentication (via backend)
* User order tracking by Order ID

### 🛒 Ordering System

* Select products
* Submit custom body measurements
* Book tailoring services
* Place orders

### 💳 Payment Flow

* Order status tracking
* Upload transaction screenshot image
* View payment confirmation status

### 🧑‍💼 Receptionist / Admin Dashboard

* View all customer orders
* Review measurements
* Request payment from customers
* View uploaded payment screenshots
* Update order status (pending, paid, in progress, completed)

---

## 🎨 Styling

* Tailwind CSS utility-first styling
* Fully responsive (mobile, tablet, desktop)
* Reusable components for consistency

---

## 🔗 API Integration

All backend communication is handled using Axios:

* `auth.api.js` – authentication requests
* `products.api.js` – products data
* `orders.api.js` – orders & measurements
* `payments.api.js` – payment upload & status

Base API URL is configured in `api/axios.js`.

---

## ⚙️ Setup Instructions

1. Clone the repository
2. Navigate to the frontend folder

```bash
cd frontend
```

3. Install dependencies

```bash
npm install
```

4. Start the development server

```bash
npm run dev
```

5. Open in browser

```
http://localhost:5173
```

---

## 🔐 Environment Variables

Create a `.env` file in the frontend root:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 📌 Notes

* This frontend depends on the Django backend API
* Ensure the backend server is running before testing features
* Payment uploads require backend media configuration

---

## 📈 Future Improvements

* Online payment gateway integration
* Order notifications
* Role-based UI enhancements
* Product reviews and ratings

---

## 🧑‍💻 Author

Built for a real-world tailoring business platform using modern web technologies.

