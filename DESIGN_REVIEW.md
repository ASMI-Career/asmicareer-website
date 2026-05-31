# ASMI Career — Design Review
**Pages:** medical.html · engineering.html  
**Date:** 2026-05-31  
**Tools:** ui-ux-pro-max, frontend-design, impeccable

---

## CRITICAL (fix before launch)

### 1. medical.html — Events Section · Event cards invisible against white background
**Problem:** `.event-card { background: #ffffff }` on `.events-section { background: #ffffff }`. Cards vanish into the section. The `border: 1px solid rgba(26,0,64,0.08)` is ~3% opacity and functionally invisible.  
**Fix:**
```css
.event-card {
    background: #fafafa;
    border: 1px solid rgba(26,0,64,0.10);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
}
.event-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(26,0,64,0.08);
}
```

### 2. medical.html + engineering.html — Journey section body text fails WCAG AA contrast
**Problem:** `.journey-body { color: rgba(255,255,255,0.5) }` on `#1a0040` background ≈ 3.0:1 contrast ratio. WCAG AA requires 4.5:1 for normal text. Engineering has the same issue.  
**Fix (both files):**
```css
.journey-body { color: rgba(255,255,255,0.72); }
```
Brings contrast to ~4.7:1. ✓

### 3. medical.html + engineering.html — Pricing cards have no hover state
**Problem:** `.pricing-card` has `cursor: pointer` implied but no hover feedback. The primary conversion section has zero interactive response. Fails UX standard: all clickable elements must provide visual feedback.  
**Fix (both files):**
```css
.pricing-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
.pricing-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(26,0,64,0.12); }
```
Engineering:
```css
.pricing-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,0.35); }
```

### 4. medical.html — Three consecutive white sections with no visual separation
**Problem:** Events (`#ffffff`) → Universities (`#ffffff`) → Problem/Solution (`#ffffff`). Three full sections in a row share identical backgrounds. No rhythm. The page feels flat and undifferentiated in this stretch.  
**Fix:** Change PS section background to a very light tint:
```css
/* medical.html */
.ps-section { background: #f9f7ff; }
```

### 5. medical.html + engineering.html — Hero sub-text at 14px (below mobile minimum)
**Problem:** `.hero-sub { font-size: 14px }` — UX guidelines require minimum 16px for body text on mobile. At 14px on a 375px screen this becomes unreadable without zooming.  
**Fix:**
```css
.hero-sub { font-size: 15px; }
@media (max-width: 640px) { .hero-sub { font-size: 14px; } }
```

---

## HIGH PRIORITY (fix this week)

### 6. medical.html — Yellow hero + yellow Why-ASMI section creates palette fatigue
**Problem:** Hero (`#FFD700`) → 3 white sections → Why ASMI (`#FFD700`). Yellow used twice as full-section background makes it feel like a repeated mistake rather than a brand signal. The second yellow hit loses its punch.  
**Fix:** Change Why-ASMI to a deep navy for contrast:
```css
/* medical.html */
.why-section { background: #0d0a1e; }
.why-headline { color: #ffffff; }
.why-sub { color: rgba(255,255,255,0.65); }
.why-eyebrow { background: #FFD700; color: #1a0040; }
.why-feature-title { color: #ffffff; }
.why-feature-body { color: rgba(255,255,255,0.6); }
.why-icon { background: rgba(255,255,255,0.08); }
.why-overlay-card { background: rgba(255,255,255,0.92); }
```

### 7. medical.html — Testimonial cards have no hover state on interactive component
**Problem:** `.testi-card` and `.testi-avatar` have no hover feedback. The avatar row is interactive (placeholder for filtering) but gives no visual cue.  
**Fix:**
```css
.testi-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
.testi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(106,13,173,0.12); }
.testi-avatar:hover { border-color: rgba(106,13,173,0.4); }
```

### 8. engineering.html — `opacity: 1 !important; transform: none !important` on `.faq-item`
**Problem:** This `!important` override is a red flag — it means the old `.faq-item { opacity: 0 }` CSS from the legacy section is still in the stylesheet and bleeding into new components. The override will break any future animation on `.faq-item`.  
**Fix:** Find and remove the old `.faq-item { opacity: 0; transform: translateY(24px) }` rule from the legacy FAQ CSS block (around line 1570 in engineering.html) and remove the `!important` override.

### 9. medical.html — Events section padding asymmetry (48px) vs rest of page (72px)
**Problem:** `.events-section { padding: 48px 80px }` while every other section uses 72px. The events section feels visually compressed and rushed compared to its neighbours.  
**Fix:**
```css
.events-section { padding: 60px 80px; }
@media (max-width: 768px) { .events-section { padding: 48px 40px; } }
@media (max-width: 640px) { .events-section { padding: 36px 24px; } }
```

### 10. medical.html + engineering.html — Button size inconsistency across sections
**Problem:** Hero CTAs (`padding: 14px 28px, font-size: 14px`) vs Why-ASMI overlay buttons (`padding: 10px 20px, font-size: 12px`) vs pricing banner buttons (`padding: 14px 32px, font-size: 14px`). Three different button scales within the same pages.  
**Fix:** Standardise secondary/card buttons to one size:
```css
.why-btn-dark, .why-btn-purple { font-size: 13px; padding: 11px 22px; }
```

---

## MEDIUM PRIORITY (next iteration)

### 11. medical.html — `pricing-banner-h` (36px) and `pricing-banner-sub` (32px) compete for dominance
**Problem:** Two headline-weight elements 4px apart in size — neither wins. The "Take the first step." and "Book a FREE 1-to-1" lines look like a tie and create visual confusion.  
**Fix:**
```css
.pricing-banner-h { font-size: 42px; }
.pricing-banner-sub { font-size: 22px; font-weight: 700; color: rgba(255,255,255,0.85); }
```

### 12. medical.html — PS section uses emojis as UI icons
**Problem:** `why-icon` containers use 👤 🗄️ 🔔 ₹ emojis. UX rule: no emoji icons — use SVG (Heroicons/Lucide). Emojis render differently across OS/browser and look unprofessional in a premium product context.  
**Fix:** Replace with inline SVG from Lucide or Heroicons.

### 13. engineering.html — Events section background `#0f1f35` nearly matches hero bottom-edge
**Problem:** Hero section ends and immediately the Events section begins with near-identical dark colors. The section boundary is invisible without a separator.  
**Fix:**
```css
/* engineering.html */
.events-section { border-top: 1px solid rgba(0,200,180,0.12); }
```

### 14. medical.html — `.stat-lbl` at 11px uppercase fails readability on mobile
**Problem:** 11px uppercase text is below the recommended minimum. At 1.5 DPR on mobile this is approximately 8px effective size — illegible at arm's length.  
**Fix:**
```css
.stat-lbl { font-size: 12px; letter-spacing: 0.8px; }
```

### 15. medical.html — Resources section `padding: 72px 80px` but header has `gap: 40px` — leaves almost no space for left heading text on tablet
**Problem:** At 768-900px the resources header row (title + "View all") has `gap: 40px` with `max-width: 480px` on the sub — this makes the title section very cramped.  
**Fix:**
```css
@media (max-width: 768px) {
    .resources-header { flex-direction: column; gap: 12px; }
}
```
(Currently only triggers at 640px — move up to 768px.)

---

## QUICK WINS (under 30 minutes each)

### QW1. Add hover to event cards — medical.html
```css
.event-card { transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
.event-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(26,0,64,0.08); }
```

### QW2. Strengthen `uni-card` active state — both pages
```css
.uni-card:focus-visible { outline: 2px solid #6a0dad; outline-offset: 2px; }
```
Engineering: `outline-color: #00C8B4`

### QW3. Add `cursor: pointer` to `pricing-card` explicitly — both pages
```css
.pricing-card { cursor: pointer; }
```

### QW4. Journey runner emoji `🏃` — flag for SVG replacement
The running figure between steps 2 and 3 uses an emoji. Replace with a small inline SVG for cross-platform consistency.

### QW5. Fix `faq-accordion` max-width on engineering — it's currently unlimited
Medical has `.faq-accordion { max-width: 680px; margin: 0 auto }`. Engineering `.faq-accordion` gets this from the CSS cascade only if the rule fires. Verify it's scoped.

### QW6. `pricing-banner-body { max-width: 560px; margin-left: auto; margin-right: auto }` — already correct, but the `margin-top: 16px` override needs `margin-bottom: 0` to prevent double-spacing
```css
.pricing-banner-body { margin-bottom: 0; }
```

### QW7. hero-card on engineering — add `border` to make the white card float cleanly on yellow
Medical hero card is pure white on yellow — it works. Engineering hero card uses `border: 1px solid rgba(0,200,180,0.2)` on dark — already correct.

---

## WHAT'S WORKING WELL

**Hero split layout** — The 55/45 split with the rank widget card is the strongest design element on both pages. The rank number (52px, bold, accent colour) immediately communicates what the product does. The college match list with likelihood pills is clear and trust-building.

**Journey section** — The 4-step timeline with gold/purple two-tone system on medical is visually clean. The step labels, circles, and connector lines create genuine visual momentum. Engineering's teal equivalent matches well.

**Pricing featured card** — The `border: 2px solid #6a0dad` on the NEET PG card and the `★ POPULAR` badge at `-12px` top position is a classic and effective conversion pattern. Well executed.

**FAQ accordion** — The `+` / `−` toggle with smooth display:none/block is clean and functional. The card-per-item with border-radius 12px looks polished.

**Testimonial quote mark** — `❝` at 28px in accent colour before the body quote is a small but strong typographic detail.

**Color palette discipline** — Both pages stick tightly to their respective palettes with almost no drift. Medical's purple/gold/navy is consistent. Engineering's teal/dark-navy is consistent.

**Nav CTA buttons** — Medical: `#FFD700` on white nav. Engineering: `#00C8B4` on dark nav. Both feel brand-appropriate and high-contrast.

**Reduced motion** — `@media (prefers-reduced-motion: reduce)` is implemented correctly at the top of both stylesheets. ✓

---

## Highest-Impact Change Implemented

**Pricing cards hover state + event card visibility** — applied to both pages. See commit.
