// Fee display helpers. feeStr and budgetStr read the fee map, so they are built from it.
export function makeFeeFormatters(feeMap, feesCfg) {
  // ── Fee formatters ──────────────────────────────────────────────────────────
  const feeStr = (name) => {
    const f = parseFloat(feeMap[name]);
    if (isNaN(f) || f === 0) return '—';
    if (f < 1)   return `₹${Math.round(f * 100)}K/yr`;
    if (f < 100) return `₹${parseFloat(f.toFixed(1))}L/yr`;
    return `₹${(f / 100).toFixed(2)}Cr/yr`;
  };
  const feeStrAIR = (rawFees) => {
    if (!rawFees) return '—';
    const r = parseFloat(String(rawFees).replace(/[,₹\s]/g, ''));
    if (isNaN(r) || r === 0) return '—';
    const lakhs = r / 100000;
    if (lakhs < 0.1) return `₹${Math.round(r).toLocaleString('en-IN')}/yr`;
    if (lakhs < 1)   return `₹${Math.round(lakhs * 100)}K/yr`;
    return `₹${parseFloat(lakhs.toFixed(1))}L/yr`;
  };
  const budgetStr = (name, course) => {
    const f = parseFloat(feeMap[name]);
    if (isNaN(f) || f === 0) return '—';
    const mult = feesCfg.yearsByCourse[course] ?? feesCfg.defaultYears;   // years of study, from the stream config
    const total = f * mult;
    if (total < 1)   return `₹${Math.round(total * 100)}K`;
    if (total < 100) return `₹${parseFloat(total.toFixed(1))}L`;
    return `₹${(total / 100).toFixed(2)}Cr`;
  };

  return { feeStr, feeStrAIR, budgetStr };
}
