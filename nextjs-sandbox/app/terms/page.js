'use client';
import './terms.css';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="legal-page">
      <nav className="legal-nav">
        <Link href="/"><img src="/asmi-logo.png" alt="ASMI Career" height="36" /></Link>
        <Link href="/contact" className="legal-nav-link">Contact Us</Link>
      </nav>

      <div className="legal-inner">
        <div className="legal-header">
          <span className="legal-eyebrow">LEGAL</span>
          <h1 className="legal-headline">Terms of Service</h1>
          <p className="legal-date">Last updated: June 2026</p>
        </div>

        <div className="legal-body">

          <div className="legal-section">
            <h2>1. Agreement</h2>
            <p>By accessing asmicareer.com, asmicareer.in, or using any ASMI Career service, you agree to these Terms of Service. If you do not agree, please do not use our services.</p>
          </div>

          <div className="legal-section">
            <h2>2. Services Provided</h2>
            <p>ASMI Youth Career Advisor LLP provides medical and engineering admissions counselling, including guidance on preference lists, form filling, document verification, and round-wise support. All services are advisory in nature — ASMI does not guarantee admission to any specific college.</p>
          </div>

          <div className="legal-section">
            <h2>3. Fees & Payment</h2>
            <ul>
              <li>Package fees vary by branch — confirmed at the time of enrolment</li>
              <li>Registration fees are non-refundable and non-transferable under any circumstances</li>
              <li>MH State and MCC form filling is included. Other states at ₹5,000/state extra</li>
              <li>All charges are inclusive of GST unless otherwise stated</li>
              <li>No additional charges for counselling, advisory, or helpline services within the package</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>4. No Guarantee of Admission</h2>
            <p>ASMI provides expert guidance based on verified data and experience. However, ASMI does not and cannot guarantee admission to any specific college, quota, or rank. Allotment outcomes depend on NEET rank, category, seat availability, and government counselling processes outside ASMI's control.</p>
          </div>

          <div className="legal-section">
            <h2>5. Student Responsibilities</h2>
            <p>Students and parents are responsible for:</p>
            <ul>
              <li>Providing accurate and complete information at the time of enrolment</li>
              <li>Ensuring all documents are genuine and valid</li>
              <li>Following ASMI's guidance on deadlines — ASMI is not responsible for missed deadlines due to student non-response</li>
              <li>Making final college decisions — ASMI advises but does not decide on behalf of students</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>6. Refund Policy</h2>
            <p>Fees paid to ASMI are non-refundable. In exceptional circumstances reviewed case by case, partial credit may be offered for future use. No refunds are issued after form filling or counselling sessions have been conducted.</p>
          </div>

          <div className="legal-section">
            <h2>7. Intellectual Property</h2>
            <p>All content on asmicareer.com and asmicareer.in — including cutoff data, guides, tools, and materials — is the property of ASMI Youth Career Advisor LLP. Reproduction or redistribution without written permission is prohibited.</p>
          </div>

          <div className="legal-section">
            <h2>8. Limitation of Liability</h2>
            <p>ASMI's liability is limited to the fee paid for the specific service. ASMI is not liable for consequential damages, loss of opportunity, or outcomes resulting from government policy changes, seat cancellations, or student decisions contrary to counsellor advice.</p>
          </div>

          <div className="legal-section">
            <h2>9. Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.</p>
          </div>

          <div className="legal-section">
            <h2>10. Contact</h2>
            <p>For terms-related queries: <a href="mailto:info@asmicareer.com">info@asmicareer.com</a> · 7410019074 · <Link href="/contact">Find your nearest branch</Link></p>
          </div>

        </div>
      </div>

      <div className="legal-footer-strip">
        <span>© 2026 ASMI Youth Career Advisor LLP</span>
        <div className="legal-footer-links">
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </div>
  );
}
