export const engineeringData = {
  hero: {
    eyebrow: "INDIA'S SMARTEST ENGINEERING ADMISSION PLATFORM",
    headline: 'Asmi gets you the branch you',
    accentWord: 'deserve.',
    sub: 'JEE & MHT-CET counselling by verified experts — a real counsellor who knows your rank, from result day to reporting day. Zero guesswork.',
    stats: [
      { num: '10K+', label: 'Admissions' },
      { num: '11+', label: 'Years of experience' },
      { num: '4.9★', label: 'Rating' },
    ],
    ctaPrimary: 'Explore tools ↓',
    ctaSecondary: 'How it works ↓',
    widget: {
      pill: 'JEE Specialists',
      pillRight: '100+ Counsellors',
      rankLabel: 'JEE RANK',
      rankNumber: '8,432',
      rankSub: 'CRL · JEE Main 2026',
      colleges: [
        { name: 'IIT Bombay — CS', likelihood: 'Possible', dot: 'rgba(0,200,180,0.6)', pillBg: 'rgba(0,200,180,0.12)', pillColor: '#00C8B4' },
        { name: 'NIT Trichy — ECE', likelihood: 'Likely ✓', dot: '#4caf50', pillBg: 'rgba(46,125,50,0.15)', pillColor: '#00C8B4' },
        { name: 'BITS Pilani — Mech', likelihood: 'Safe Seat', dot: 'rgba(0,168,150,0.7)', pillBg: 'rgba(0,200,180,0.08)', pillColor: '#00A896' },
      ],
      successLabel: 'Placement rate',
      successValue: '95%+ students',
    },
  },

  events: [
    { tag: 'JEE', tagBg: 'rgba(0,200,180,0.15)', tagColor: '#00C8B4', time: '2 hours ago', title: 'JEE Advanced 2026 Registration Open', body: "Last date to apply is June 2nd, 2026. Don't miss the deadline." },
    { tag: 'URGENT', tagBg: 'rgba(211,47,47,0.15)', tagColor: '#ef5350', time: '5 hours ago', title: 'JEE Main Session 2 Results Out', body: 'Check your scorecard now on the official NTA portal.' },
    { tag: 'MHT-CET', tagBg: 'rgba(0,200,180,0.1)', tagColor: '#00C8B4', time: 'Yesterday', title: 'MHT-CET 2026 Merit List Released', body: 'Download your merit list and prepare for CAP rounds.' },
  ],

  universities: [
    { rating: '★ 4.2/5', city: 'Mumbai', stream: 'Engineering', name: 'IIT Bombay', recommended: false },
    { rating: '★ 4.8/5', city: 'Bangalore', stream: 'Engineering', name: 'IISc Bangalore', recommended: false },
    { rating: '★ 4.8/5', city: 'Pilani', stream: 'Engineering', name: 'BITS Pilani', recommended: true },
    { rating: '★ 4.5/5', city: 'Trichy', stream: 'Engineering', name: 'NIT Trichy', recommended: false },
  ],

  ps: {
    headline: 'Engineering Students Lose Branches — Before Counselling Even Starts.',
    sub: "Here's what goes wrong — and exactly how ASMI fixes it.",
    problems: [
      'Wrong Branch-College Combo = Career Regret',
      'JoSAA Rounds Close in 24 Hours. No Extensions.',
      'Coaching Centres Pushing Wrong Colleges for Commission',
    ],
    solutions: [
      'Branch-first strategy built around your rank and career goal.',
      'Real-time JoSAA and CSAB alerts on WhatsApp every round.',
      'Only NIC-verified data. No coaching bias. No commissions.',
    ],
  },

  why: {
    eyebrow: 'WHY ASMI',
    headline: "India's Most Trusted Engineering Admission Platform",
    sub: '11 years. 10,000+ branches secured. Here\'s what makes the difference.',
    features: [
      { icon: '👤', title: 'Verified Counsellors', body: 'JEE-specialist counsellors, not generalists. They know every branch cutoff.' },
      { icon: '🗄️', title: 'Official Data Only', body: 'Cutoffs pulled directly from JoSAA, CSAB, and state portals. Live data.' },
      { icon: '🔔', title: 'Real-Time Alerts', body: 'WhatsApp updates every JoSAA round — freeze deadlines, upgrade windows, everything.' },
      { icon: '₹', title: 'Transparent Pricing', body: 'Fixed packages. No institute commissions. No hidden referral fees.' },
    ],
    overlayTag: '● CRACK YOUR TARGET BRANCH',
    overlayTitle: 'How ASMI secures your branch',
    overlaySub: 'See how we guide 10,000+ students through every JoSAA round — from rank to reporting date.',
    overlayBg: 'linear-gradient(160deg,#0a1628 0%,#00A896 100%)',
  },

  journey: {
    headline: 'The ASMI Engineering Journey',
    sub: '4 phases from your rank to your branch letter.',
    icon: '⚙️',
    bg: '#0a1628',
    steps: [
      { num: '1', label: 'Cutoff Analysis', body: 'Understand branch-wise cutoff trends before filling any preference.', style: 'gold' as const },
      { num: '2', label: '1-on-1 Strategy', body: 'Dedicated counsellor maps your rank to your best branch options.', style: 'gold' as const },
      { num: '3', label: 'Smart Pref List', body: 'JoSAA/CSAB preference list built for maximum upgrade potential.', style: 'purple' as const },
      { num: '4', label: 'Final Admission', body: 'Support through freeze deadline, document verification, reporting.', style: 'purple' as const },
    ],
  },

  pricing: {
    eyebrow: 'SERVICES',
    headline: 'Every Engineering Path, Covered.',
    sub: 'From JEE to MHT-CET to BITS — expert support for every rank and every round.',
    sub2: 'Big On Data. Light On Your Pocket.',
    cards: [
      { exam: 'JEE MAIN', course: 'B.Tech Counselling', type: 'JoSAA / CSAB', price: '₹2,499', featured: false },
      { exam: 'JEE ADVANCED', course: 'IIT Counselling', type: 'JoSAA Full Support', price: '₹3,999', featured: true },
      { exam: 'MHT-CET', course: 'CAP Counselling', type: 'Maharashtra Rounds', price: '₹3,999', featured: false },
      { exam: 'BITS/MANIPAL/VIT', course: 'Private Univ Guidance', type: 'Admission Guidance', price: '₹3,999', featured: false },
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
    { name: 'Rahul Sharma', edu: 'JEE Advanced 2024', college: 'IIT Bombay CS', quote: "ASMI's branch strategy was spot on. Got CS at IIT Bombay in round 1 itself.", featured: false },
    { name: 'Priya Nair', edu: 'JEE Main 2024', college: 'NIT Trichy ECE', quote: 'They built my preference list across 180 colleges. Upgraded twice. Ended up exactly where I wanted.', featured: true },
    { name: 'Arjun Mehta', edu: 'MHT-CET 2024', college: 'COEP Pune', quote: 'The JoSAA round alerts on WhatsApp saved me from missing the freeze deadline. Literally life-changing.', featured: false },
  ],

  resources: [
    { tag: 'ARTICLE', tagBg: '#1565c0', tagColor: '#ffffff', imgBg: 'linear-gradient(135deg,#0a1628 0%,#1565c0 100%)', emoji: '📊', title: 'JEE Rank vs Branch: The Real Tradeoffs', body: "Understand which branches are worth the rank drop — and which aren't.", meta: '2400 words', cta: 'Read more →', ctaType: 'link' as const },
    { tag: 'DOWNLOAD', tagBg: '#00C8B4', tagColor: '#0a1628', imgBg: 'linear-gradient(135deg,#e0f7fa 0%,#b2ebf2 100%)', emoji: '📄', title: 'JoSAA Round-wise Cutoff PDF 2025', body: 'All IIT, NIT, IIIT cutoffs from JoSAA 2025 — round by round.', meta: 'PDF · 2.1 MB', cta: 'Get it Now ↓', ctaType: 'button' as const },
    { tag: 'VIDEO', tagBg: '#00897b', tagColor: '#ffffff', imgBg: 'linear-gradient(135deg,#e8f5e9 0%,#00695c 100%)', emoji: '▶️', title: 'How to Build Your JoSAA Preference List', body: 'Step-by-step walkthrough of building a winning preference list.', meta: '12 min 40 sec', cta: 'Watch →', ctaType: 'link' as const },
  ],

  faqs: [
    { q: 'What is JoSAA counselling and how does ASMI help?', a: 'JoSAA is the joint seat allocation process for IITs, NITs, IIITs, and GFTIs. ASMI assigns a dedicated counsellor who builds your preference list, tracks every round, and guides you through freeze, float, and slide options.' },
    { q: "How is ASMI different from my coaching centre's guidance?", a: 'Coaching centres give generic advice to thousands of students. ASMI gives you a personalised branch-college strategy based on your specific rank, category, home state, and career goal — with a counsellor accountable to your outcome.' },
    { q: 'Does ASMI cover MHT-CET and private universities like BITS?', a: 'Yes. ASMI has dedicated teams for JEE Main, JEE Advanced, MHT-CET CAP rounds, and private university admissions including BITS, Manipal, VIT, and SRM.' },
    { q: 'How much do your packages cost?', a: 'Packages start at ₹2,499 for JEE Main counselling and go up to ₹3,999 for full IIT/JoSAA end-to-end support. All pricing is fixed — no hidden charges or institute commissions.' },
    { q: 'Can I upgrade my branch after getting a seat?', a: "Yes — through JoSAA's float option. ASMI monitors every round and alerts you instantly when an upgrade opportunity appears, so you never miss a window." },
    { q: 'Can parents track the process throughout?', a: 'Yes. Parents receive WhatsApp updates at every stage — round results, freeze deadlines, document checklists, and reporting date reminders.' },
  ],
}
