import TopNav from '../../components/website/TopNav';
import SiteFooter from '../../components/website/SiteFooter';
import SEO from '../../components/seo/SEO';

const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: '1. Information We Collect',
    body: [
      'We collect the information you provide when you create an account or book a trip, including your name, phone number, email address, and booking details.',
      'When you make a payment, the transaction is processed by our mobile money or card payment partners. Katisha does not store full card numbers.',
      'We may collect device and usage information such as app version, device type, and notification preferences to operate journey alerts.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: [
      'To create and manage your account, process bookings, and issue digital tickets.',
      'To send booking confirmations, payment updates, and journey alerts via push or local notifications.',
      'To operate, secure, and improve the Katisha service, and to respond to support requests.',
    ],
  },
  {
    title: '3. Sharing of Information',
    body: [
      'We share booking details (such as passenger name and seat) with the bus agency operating your trip so your ticket can be issued.',
      'We do not sell your personal information. We only share data with service providers (payment processors, notification delivery) as needed to run the service, or when required by law.',
    ],
  },
  {
    title: '4. Data Retention',
    body: [
      'We retain your account and booking history for as long as your account is active and as needed to provide the service and comply with legal obligations.',
    ],
  },
  {
    title: '5. Your Rights',
    body: [
      'You may request access to, correction of, or deletion of your personal data by contacting us at support@katisha.today.',
      'You can disable notifications at any time in your device settings.',
    ],
  },
  {
    title: '6. Security',
    body: [
      'We use industry-standard measures to protect your information, including HTTPS for all traffic and secure storage for authentication tokens.',
    ],
  },
  {
    title: '7. Changes to This Policy',
    body: [
      'We may update this policy from time to time. The latest version will always be available at this page.',
    ],
  },
  {
    title: '8. Contact Us',
    body: [
      'Questions about this policy? Reach us at support@katisha.today.',
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <SEO
        title="Privacy Policy"
        description="How Katisha collects, uses, and protects your personal data."
        canonical="/privacy"
      />
      <TopNav />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: October 4, 2026</p>
        {SECTIONS.map((s) => (
          <section key={s.title} className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">{s.title}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="text-sm text-slate-600 leading-relaxed mb-2">{p}</p>
            ))}
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
