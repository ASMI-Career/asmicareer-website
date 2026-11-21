import { useRef, useState } from 'react';

// Engineering "Branch Guide": the 31-question branch assessment (a static page) shown inside the dashboard.
// ?embed=1 makes that page hide its own header, stats and call-to-action. The student's name and percentile are handed over with
// postMessage (same origin only), never in the URL.
const SRC = '/tools/branch-assessment/?embed=1';

function expectedText(profile) {
  const num = (v) => (v === null || v === undefined || v === '' || !isFinite(Number(v)) || Number(v) <= 0 ? null : Number(v));
  const j = profile && num(profile.jee_main_percentile); if (j !== null) return `JEE Main ${j} percentile`;
  const m = profile && num(profile.mhtcet_percentile); if (m !== null) return `MHT-CET ${m} percentile`;
  return '';
}

export default function BranchGuide({ studentName, profile }) {
  const frame = useRef(null);
  const [loaded, setLoaded] = useState(false);

  const onLoad = () => {
    setLoaded(true);
    try {
      frame.current.contentWindow.postMessage({ type: 'asmi-profile', name: studentName || '', expected: expectedText(profile) }, window.location.origin);
    } catch (e) { /* the quiz still works without the prefill */ }
  };

  return (
    <div className="bg-wrap">
      <div className="bg-head">
        <h2 className="bg-title">Branch Guide</h2>
        <p className="bg-sub">Answer 31 questions and get your best-fit engineering branches, with a personal report.</p>
      </div>
      <div className="bg-card">
        {!loaded && <div className="bg-loading" role="status">Loading…</div>}
        <iframe ref={frame} className="bg-frame" src={SRC} title="Branch Guide" onLoad={onLoad} />
      </div>
    </div>
  );
}
