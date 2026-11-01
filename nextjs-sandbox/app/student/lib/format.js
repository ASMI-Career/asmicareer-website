// ── Helper functions ──────────────────────────────────────────────────────────
export const getBranchFromToken = (token) => {
  if (!token) return 'ASMI Career Network';
  const tok = String(token).toUpperCase();
  if (tok.includes('MUM')) return 'Mumbai Branch Office';
  if (tok.includes('PUN') || tok.includes('PNE')) return 'Pune Branch Office';
  if (tok.includes('NGP') || tok.includes('NAG')) return 'Nagpur Branch Office';
  if (tok.includes('KOL')) return 'Kolhapur Branch Office';
  if (tok.includes('SAN')) return 'Sangli Branch Office';
  if (tok.includes('CSN') || tok.includes('SAM')) return 'Chh. Sambhajinagar Branch Office';
  if (tok.includes('THN') || tok.includes('THA')) return 'Thane Branch Office';
  if (tok.includes('NSK') || tok.includes('NAS')) return 'Nashik Branch Office';
  return 'ASMI Regional Branch';
};

export const getWhatsAppLink = (number) => {
  if (!number) return 'https://wa.me/917410019074';
  const cleanNum = String(number).replace(/\D/g, '');
  return 'https://wa.me/' + (cleanNum.startsWith('91') ? cleanNum : '91' + cleanNum);
};

export const cleanFee = (feesStr) => {
  if (!feesStr) return 0;
  return parseInt(String(feesStr).replace(/[^0-9]/g, ''), 10) || 0;
};

export const formatFees = (feesStr) => {
  const rawFee = cleanFee(feesStr);
  if (rawFee === 0) return '₹ — / yr';
  if (rawFee < 100000) return `₹${rawFee.toLocaleString('en-IN')} / yr`;
  const lakhs = (rawFee / 100000).toFixed(2);
  return `₹${lakhs} L / yr`;
};
