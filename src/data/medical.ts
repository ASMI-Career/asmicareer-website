export const medicalData = {
  hero: {
    eyebrow: "INDIA'S SMARTEST YOUTH CAREER PLATFORM",
    headline: 'Asmi gives you the seat you',
    accentWord: 'deserve.',
    sub: 'NEET & JEE counselling by verified experts — a real counsellor who knows your file, from rank day to admission day. Zero guesswork.',
    stats: [
      { num: '10+', label: 'Years of experience' },
      { num: '20k+', label: 'Admissions done!' },
      { num: '4.9 rating ★', label: 'on google reviews' },
    ],
    ctaPrimary: 'Explore tools ↓',
    ctaSecondary: 'How it works ↓',
    widget: {
      pill: 'Expert mentors',
      pillRight: '100+ Counsellors',
      rankLabel: 'NEET RANK',
      rankNumber: '2,847',
      rankSub: 'AIR · NEET UG 2026',
      colleges: [
        { name: 'AIIMS New Delhi', likelihood: 'Likely ✓', dot: '#4caf50', pillBg: '#e8f5e9', pillColor: '#2e7d32' },
        { name: 'Maulana Azad Medical', likelihood: 'Possible', dot: '#ffb300', pillBg: '#fff8e1', pillColor: '#f57c00' },
        { name: 'Grant Medical College', likelihood: 'Safe Seat', dot: '#2196f3', pillBg: '#e3f2fd', pillColor: '#1565c0' },
      ],
      successLabel: 'Success rate',
      successValue: '90%+ students',
    },
  },

  events: [
    { tag: 'ENGINEERING', tagBg: '#e8f0ff', tagColor: '#6a0dad', time: '2 hours ago', title: 'JEE Advanced 2024 Registration Open', body: "Last date to apply is May 7th, 2024. Don't miss the deadline." },
    { tag: 'URGENT', tagBg: '#fff0f0', tagColor: '#d32f2f', time: '5 hours ago', title: 'NEET UG Admit Card Released', body: 'Download your hall tickets now from the official website.' },
    { tag: 'MEDICAL', tagBg: '#f3e5ff', tagColor: '#6a0dad', time: 'Yesterday', title: 'NEET Results Announcement', body: 'Results scheduled for the second week of June. Stay tuned.' },
  ],

  universities: [
    { rating: '★ 3.8/5', city: 'Pune', stream: 'Medical', name: 'Symbiosis Medical College for Women (SMCW)', recommended: false },
    { rating: '★ 4.8/5', city: 'Bangalore', stream: 'Medical', name: 'Kasturba Medical College, Manipal', recommended: false },
    { rating: '★ 4.8/5', city: 'Mumbai', stream: 'Medical', name: 'Grant Medical College & Sir J.J. Hospitals', recommended: true },
    { rating: '★ 4.8/5', city: 'Delhi', stream: 'Medical', name: 'Maulana Azad Medical College', recommended: false },
  ],

  ps: {
    headline: 'Students Fail Counselling — Before It Even Starts.',
    sub: "Here's what goes wrong — and exactly how ASMI fixes it.",
    problems: [
      'Wrong Preference Order = Seat Lost Forever',
      'Deadlines Close in 24–72 Hours. No Mercy.',
      'Fake Agents Charging ₹5–10L for "Guaranteed" Seats',
    ],
    solutions: [
      'Algorithm-optimised preference list, submitted before deadline.',
      'WhatsApp alerts for every round deadline instantly.',
      'Only verified portals. No middlemen. Fixed transparent pricing.',
    ],
  },

  why: {
    eyebrow: 'WHY ASMI',
    headline: "India's Most Trusted Admission Platform",
    sub: '11 years. 25,000+ seats. Here\'s what makes the difference.',
    features: [
      { icon: '👤', title: 'Verified Counsellors', body: 'Credentialed, background-checked experts. No anonymous advisors.' },
      { icon: '🗄️', title: 'Official Data Only', body: 'Cutoffs pulled directly from MCC, JoSAA, and state portals. No guesswork.' },
      { icon: '🔔', title: 'Real-Time Alerts', body: 'WhatsApp updates to student and parent — every round, every deadline.' },
      { icon: '₹', title: 'Transparent Pricing', body: 'Fixed packages, fully documented. No hidden fees, no commissions.' },
    ],
    overlayTag: '● CRACK THE NEXT STEP',
    overlayTitle: 'How ASMI helps students win',
    overlaySub: 'See how we guide 25,000+ students through every step — from rank to reporting date.',
    overlayBg: 'linear-gradient(160deg,#1a0040 0%,#6a0dad 100%)',
  },

  journey: {
    headline: 'The ASMI Admission Journey',
    sub: '4 phases from your rank to your admission letter.',
    icon: '🌱',
    bg: '#1a0040',
    steps: [
      { num: '1', label: 'Cutoff Seminar', body: 'Understand real trends before you fill any preference.', style: 'gold' as const },
      { num: '2', label: '1-on-1 Strategy', body: 'Dedicated counsellor builds your personalised plan.', style: 'gold' as const },
      { num: '3', label: 'Smart Pref List', body: 'Algorithm-optimised preference list. Zero guesswork.', style: 'purple' as const },
      { num: '4', label: 'Final Admission', body: 'Support through to your reporting date.', style: 'purple' as const },
    ],
  },

  pricing: {
    eyebrow: 'SERVICES',
    headline: 'Every Admission Path, Covered.',
    sub: 'From NEET to JEE to MBBS Abroad — expert support for every stream and every round.',
    sub2: 'Big On Data. Light On Your Pocket.',
    cards: [
      { exam: 'NEET UG', course: 'NEET UG', type: 'UG Counselling', price: '₹2,499', featured: false },
      { exam: 'NEET PG', course: 'NEET PG', type: 'PG Counselling', price: '₹3,999', featured: true },
      { exam: 'JEE', course: 'JEE', type: 'B.Tech Counselling', price: '₹3,999', featured: false },
      { exam: 'MBBS ABROAD', course: 'MBBS Abroad', type: 'Admission Guidance', price: '₹3,999', featured: false },
    ],
    banner: {
      headline: 'Take the first step.',
      sub: 'Book a FREE 1-to-1 with an Asmi Counsellor.',
      body: 'Talk to a real mentor in under 24 hours. No payment, no obligation — just clarity on what your future could look like.',
      cta1: 'Book My Free Session →',
      cta2: 'WhatsApp Us 💬',
    },
  },

  testimonials: [
    { name: 'Dr. Sarang Chaudhari', edu: 'NEET UG 2024', college: 'AIIMS New Delhi', quote: "ASMI's counsellor guided me through every round of MCC counselling. Got my first preference college.", featured: false },
    { name: 'Anannya Ayer', edu: 'NEET UG 2024', college: 'Grant Medical College', quote: 'The preference list they built for me was perfect. Zero panic, all clarity from day one.', featured: true },
    { name: 'Dr. Pooja Kulkarni', edu: 'NEET PG 2024', college: 'Kasturba Medical College', quote: 'Paid ₹3,999 and saved lakhs in wrong decisions. Best investment of my medical journey.', featured: false },
  ],

  resources: [
    { tag: 'ARTICLE', tagBg: '#3949ab', tagColor: '#ffffff', imgBg: 'linear-gradient(135deg,#1a237e 0%,#283593 100%)', emoji: '🧠', title: 'Mastering Focus in the Digital Age', body: 'Learn why multi-tasking is a myth and how to regain your deep focus hours without draining...', meta: '2000 words', cta: 'Read more →', ctaType: 'link' as const },
    { tag: 'DOWNLOAD', tagBg: '#FFD700', tagColor: '#1a0040', imgBg: 'linear-gradient(135deg,#f5f5dc 0%,#e8f5e9 100%)', emoji: '📄', title: 'Study Planner Pro Template', body: 'A comprehensive weekly planner designed for university students to track the latest updates...', meta: 'PDF · 1.2 MB', cta: 'Get it Now ↓', ctaType: 'button' as const },
    { tag: 'VIDEO', tagBg: '#00897b', tagColor: '#ffffff', imgBg: 'linear-gradient(135deg,#e8f5e9 0%,#b2dfdb 100%)', emoji: '▶️', title: 'Mental Wellness for Students', body: 'A complete guide to navigating stress, anxiety, and burnout during final exam...', meta: '7 min 21 sec', cta: 'Watch →', ctaType: 'link' as const },
  ],

  faqs: [
    { q: 'What is NEET counselling and how does ASMI help?', a: 'NEET counselling is the process of selecting and filling college preferences after your NEET result. ASMI assigns you a dedicated counsellor who builds your preference list, tracks deadlines, and guides you through every round — MCC AIQ, state quota, and deemed.' },
    { q: 'How is ASMI different from free YouTube advice?', a: 'YouTube gives general information. ASMI gives you a personalised strategy based on your specific rank, category, state, and target colleges — with a real counsellor accountable to your outcome.' },
    { q: 'Does ASMI cover both NEET UG and JEE?', a: 'Yes. ASMI has dedicated teams for NEET UG, NEET PG, JEE Main, JEE Advanced, MHT-CET, and MBBS Abroad counselling.' },
    { q: 'How much do your packages cost?', a: 'Packages start at ₹2,499 for basic counselling and go up to ₹3,999 for full-service end-to-end support. All pricing is fixed — no hidden charges.' },
    { q: "What if I don't get a seat after paying?", a: "We don't guarantee seats — no honest counsellor can. But we guarantee a complete, optimised strategy built around your rank. Most students who follow our preference list secure a seat in round 1 or 2." },
    { q: 'Can parents stay updated throughout?', a: 'Yes. Parents receive WhatsApp updates at every stage — round results, deadline reminders, document checklists, and reporting date alerts.' },
  ],
}
