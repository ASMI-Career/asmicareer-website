'use client';
import './privacy.css';
import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <Nav />

      <div className="legal-inner">
        <div className="legal-header">
          <span className="legal-eyebrow">LEGAL</span>
          <h1 className="legal-headline">Privacy Policy</h1>
          <p className="legal-date">Last updated: June 2026</p>
        </div>

        <div className="legal-body">

          <div className="legal-section">
            <h2>1. Who We Are</h2>
            <p>ASMI Youth Career Advisor LLP ("ASMI", "we", "our") operates asmicareer.com and asmicareer.in — platforms providing NEET and JEE medical and engineering admissions counselling services across India. Our registered office is at 42, 4th Floor, A Wing, Silver Astra, J.B. Nagar, Andheri East, Mumbai.</p>
          </div>

          <div className="legal-section">
            <h2>2. Information We Collect</h2>
            <p>We collect the following information when you use our services:</p>
            <ul>
              <li><strong>Contact details:</strong> Name, mobile number, email address, city</li>
              <li><strong>Academic information:</strong> NEET score, AIR rank, category, state domicile</li>
              <li><strong>Inquiry data:</strong> Branch preference, course interest, counselling queries</li>
              <li><strong>Usage data:</strong> Pages visited, tools used, time spent on site (via analytics)</li>
              <li><strong>Communication records:</strong> WhatsApp messages, calls, and email exchanges with ASMI team</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>3. How We Use Your Information</h2>
            <p>Your information is used exclusively to:</p>
            <ul>
              <li>Provide personalised admissions counselling and guidance</li>
              <li>Send deadline alerts, round updates, and admission notifications via WhatsApp</li>
              <li>Route your inquiry to the correct ASMI branch and counsellor</li>
              <li>Improve our tools, data, and counselling quality</li>
              <li>Respond to your queries and support requests</li>
            </ul>
            <p>We do not use your data for targeted advertising or sell it to third parties.</p>
          </div>

          <div className="legal-section">
            <h2>4. Data Sharing</h2>
            <p>We do not sell, rent, or trade your personal information. We may share data with:</p>
            <ul>
              <li><strong>ASMI branch counsellors:</strong> To provide your assigned counselling service</li>
              <li><strong>Service providers:</strong> Google Analytics, Cloudflare, Supabase (infrastructure only)</li>
              <li><strong>Legal authorities:</strong> When required by law or court order</li>
            </ul>
            <p>We do not share data with colleges, agents, or any third-party commercial entities.</p>
          </div>

          <div className="legal-section">
            <h2>5. WhatsApp Communication</h2>
            <p>By submitting your number via any ASMI inquiry form, you consent to receiving WhatsApp messages from ASMI for admission updates, deadline alerts, and counselling-related communication. You may opt out at any time by messaging "STOP" to any ASMI WhatsApp number.</p>
          </div>

          <div className="legal-section">
            <h2>6. Data Retention</h2>
            <p>We retain your data for as long as you are an active ASMI student or have an open inquiry. Admission records are retained for up to 3 years after your admission cycle for reference and quality purposes. You may request deletion of your data at any time.</p>
          </div>

          <div className="legal-section">
            <h2>7. Security</h2>
            <p>Your data is stored on secure servers (Supabase/Cloudflare) with industry-standard encryption. Access is restricted to authorised ASMI team members only. We regularly review our security practices.</p>
          </div>

          <div className="legal-section">
            <h2>8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access the data we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Opt out of WhatsApp communications</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:info@asmicareer.com">info@asmicareer.com</a> or call 7410019074.</p>
          </div>

          <div className="legal-section">
            <h2>9. Cookies</h2>
            <p>We use essential cookies for site functionality and Google Analytics cookies for usage analysis. We do not use advertising cookies. You may disable cookies in your browser settings — this may affect some site features.</p>
          </div>

          <div className="legal-section">
            <h2>10. Changes to This Policy</h2>
            <p>We may update this policy periodically. Significant changes will be communicated via WhatsApp to registered students. The "Last updated" date at the top of this page reflects the most recent revision.</p>
          </div>

          <div className="legal-section">
            <h2>11. Contact</h2>
            <p>For privacy-related queries: <a href="mailto:info@asmicareer.com">info@asmicareer.com</a> · 7410019074 · <Link href="/contact">Find your nearest branch</Link></p>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
