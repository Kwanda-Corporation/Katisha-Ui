import { useSearchParams } from 'react-router';
import TopNav from '../../components/website/TopNav';
import BookingWizard from '../../components/website/BookingWizard';
import HomeSections from '../../components/website/HomeSections';
import SiteFooter from '../../components/website/SiteFooter';
import SEO from '../../components/seo/SEO';

export default function WebsiteHome() {
  const [searchParams] = useSearchParams();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SEO
        title="Book a Bus Ticket Online in Rwanda & East Africa"
        description="Book bus tickets online in Rwanda and across East Africa at RURA-approved prices. Compare routes from Kigali to Kampala, Nairobi, Dar es Salaam, Mbarara, Musanze, Huye & Rubavu. Pay with MTN Mobile Money, Airtel Money & M-Pesa. Instant e-tickets and live bus tracking."
        canonical="/"
        keywords="book bus ticket Rwanda, online bus booking Rwanda, bus tickets Rwanda, East Africa bus booking, bus ticket East Africa, Kigali bus tickets, Kigali to Kampala bus, Kigali to Nairobi bus, Kigali to Dar es Salaam bus, Kigali to Mbarara bus, Kigali to Musanze bus, bus from Kigali, RURA approved bus fares, Katisha booking, mobile money bus payment, book bus online East Africa"
        hreflang={[
          { lang: 'en', href: 'https://katisha.today/' },
          { lang: 'x-default', href: 'https://katisha.today/' },
        ]}
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              "name": "Katisha Bus Booking",
              "url": "https://katisha.today/book",
              "applicationCategory": "TravelApplication",
              "operatingSystem": "Web, Android, iOS",
              "description": "Book bus tickets online in Rwanda at RURA-approved prices. Compare routes, agencies, and prices.",
              "browserRequirements": "Requires JavaScript",
              "offers": {
                "@type": "AggregateOffer",
                "priceCurrency": "RWF",
                "lowPrice": "1000",
                "highPrice": "50000",
                "offerCount": 25,
                "availability": "https://schema.org/InStock"
              },
              "featureList": [
                "RURA-approved pricing",
                "Real-time bus tracking",
                "MTN Mobile Money payments",
                "Airtel Money payments",
                "M-Pesa payments",
                "Multi-language support",
                "Instant e-ticket delivery"
              ],
              "provider": { "@id": "https://katisha.today/#organization" }
            },
            {
              "@type": "WebSite",
              "@id": "https://katisha.today/#website",
              "url": "https://katisha.today/",
              "name": "Katisha",
              "publisher": { "@id": "https://katisha.today/#organization" },
              "inLanguage": ["en", "rw", "sw", "fr"],
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://katisha.today/book?origin={search_term_string}&destination={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            }
          ]
        }}
      />

      <TopNav />

      <main className="flex-1 w-full">
        {/* Page-level H1 — the booking wizard's own heading is an H2, so this
            gives crawlers a clear, keyword-rich primary heading for the page. */}
        <h1 className="sr-only">Book bus tickets online in Rwanda and East Africa — Katisha</h1>
        <div className="w-full mx-auto py-1.5 sm:py-0">
          <BookingWizard key={searchParams.get('to') || searchParams.get('destination') || 'default'} />
        </div>
        <HomeSections />
      </main>

      <SiteFooter />
    </div>
  );
}
