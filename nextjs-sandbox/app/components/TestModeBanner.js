'use client';

// Red bar pinned to the bottom of the screen on any non-production host, so nobody mistakes a
// preview for the live site (position: fixed, so it stays visible while scrolling and under the success modal).
export default function TestModeBanner({ target }) {
  if (!target || !target.testMode) return null;
  return (
    <div
      role="alert"
      id="testModeBanner"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 100000, background: '#b00020', color: '#fff',
        padding: '10px 16px', textAlign: 'center', fontWeight: 700, fontSize: '14px', lineHeight: 1.4,
      }}
    >
      {target.label}
    </div>
  );
}
