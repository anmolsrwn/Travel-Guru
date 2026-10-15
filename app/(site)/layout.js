// Public site chrome (route group: does not change URLs). Wraps the home page
// with the client providers and the persistent Header / Footer / floating
// WhatsApp / mobile sticky bar. /admin/* lives outside this group and gets none of it.
//
// Providers render no DOM of their own, so Header, <main>, Footer and the
// floating bars stay direct children of <body>, siblings of #modal-root
// (rendered by app/layout.js) — ModalProvider marks exactly those siblings inert.
import Footer from "@/components/sections/Footer";
import { ModalProvider } from "@/components/client/ModalProvider";
import { QuoteIntentProvider } from "@/components/client/QuoteIntentProvider";
import Header from "@/components/client/Header";
import FloatingWhatsApp from "@/components/client/FloatingWhatsApp";
import MobileStickyBar from "@/components/client/MobileStickyBar";

export default function SiteLayout({ children }) {
  return (
    <ModalProvider>
      <QuoteIntentProvider>
        <Header />
        {children}
        <Footer />
        <FloatingWhatsApp />
        <MobileStickyBar />
      </QuoteIntentProvider>
    </ModalProvider>
  );
}
