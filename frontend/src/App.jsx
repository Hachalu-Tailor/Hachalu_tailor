import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Items from './pages/Items';
import Services from './pages/Services';
import About from './pages/About';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Everything inside this Route uses the MainLayout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="items" element={<Items />} />
          <Route path="services" element={<Services />} />
          <Route path="about" element={<About />} />
       
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;