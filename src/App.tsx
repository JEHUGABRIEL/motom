import { Suspense, lazy, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import PromoBanner from "./components/PromoBanner";
import ScrollToTop from "./components/ScrollToTop";
import LoadingScreen from "./components/LoadingScreen";

// Les pages sont chargées à la demande : le bundle d'entrée reste léger.
// Le back-office vit dans son propre dépôt (motom-admin) et n'est pas servi ici.
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Vente = lazy(() => import("./pages/Vente"));
const Location = lazy(() => import("./pages/Location"));
const PropertyDetails = lazy(() => import("./pages/PropertyDetails"));
const Vehicles = lazy(() => import("./pages/Vehicles"));
const VehiculesLocation = lazy(() => import("./pages/VehiculesLocation"));
const VehiculesVente = lazy(() => import("./pages/VehiculesVente"));
const VehicleDetails = lazy(() => import("./pages/VehicleDetails"));
const Services = lazy(() => import("./pages/Services"));
const PolePage = lazy(() => import("./pages/PolePage"));
const Contact = lazy(() => import("./pages/Contact"));
const LegalPage = lazy(() => import("./pages/LegalPage"));

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-white">
      <Loader2 size={20} className="animate-spin text-gold-dark" />
    </div>
  );
}

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
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-white">
        <ScrollToTop />
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<PageFallback />}>
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
          </Suspense>
        </main>
        <Footer />
        <WhatsAppButton />
        <PromoBanner />
      </div>
    </QueryClientProvider>
  );
}

export default App;
