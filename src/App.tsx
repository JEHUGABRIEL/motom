import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import PromoBanner from "./components/PromoBanner";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import About from "./pages/About";
import Vente from "./pages/Vente";
import Location from "./pages/Location";
import PropertyDetails from "./pages/PropertyDetails";
import Vehicles from "./pages/Vehicles";
import VehiculesLocation from "./pages/VehiculesLocation";
import VehiculesVente from "./pages/VehiculesVente";
import VehicleDetails from "./pages/VehicleDetails";
import Services from "./pages/Services";
import PolePage from "./pages/PolePage";
import Contact from "./pages/Contact";
import LegalPage from "./pages/LegalPage";
import Admin from "./pages/Admin";
import AdminInvite from "./pages/AdminInvite";
import AdminReset from "./pages/AdminReset";
import LoadingScreen from "./components/LoadingScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAdmin) {
    return (
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/admin/invite" element={<AdminInvite />} />
          <Route path="/admin/reset" element={<AdminReset />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-white">
        <ScrollToTop />
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/a-propos" element={<About />} />
            <Route path="/biens-a-vendre" element={<Vente />} />
            <Route path="/biens-a-louer" element={<Location />} />
            <Route path="/proprietes/:id" element={<PropertyDetails />} />
            <Route path="/vehicules" element={<Vehicles />} />
            <Route path="/vehicules-a-louer" element={<VehiculesLocation />} />
            <Route path="/vehicules-a-vendre" element={<VehiculesVente />} />
            <Route path="/vehicules/:id" element={<VehicleDetails />} />
            <Route path="/services" element={<Services />} />
            <Route path="/construction" element={<PolePage slug="construction" />} />
            <Route path="/transport" element={<PolePage slug="transport" />} />
            <Route path="/demenagement" element={<PolePage slug="demenagement" />} />
            <Route path="/decoration-interieure" element={<PolePage slug="decoration" />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/confidentialite" element={<LegalPage kind="privacy" />} />
            <Route path="/mentions-legales" element={<LegalPage kind="legal" />} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppButton />
        <PromoBanner />
      </div>
    </QueryClientProvider>
  );
}

export default App;
