'use client';

import { useEffect } from 'react';
import { captureAttribution } from '../../lib/leadForm';

// Mounted once in the root layout. Saves utm_source / utm_medium / utm_campaign / gclid
// from the landing URL so the inquiry form can submit them even after the visitor
// has clicked through several pages.
export default function AttributionCapture() {
  useEffect(() => { captureAttribution(); }, []);
  return null;
}
