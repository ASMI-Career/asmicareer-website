export type Stream = 'medical' | 'engineering'

export interface PaletteConfig {
  primaryBg: string
  accentColor: string
  secondaryAccent: string
  darkColor: string
  textMuted: string
  cardBg: string
  cardBorder: string
  tagBg: string
  tagText: string
  tagBorder: string
  pillBg: string
  pillText: string
}

export const medicalPalette: PaletteConfig = {
  primaryBg: '#FFD700',
  accentColor: '#6a0dad',
  secondaryAccent: '#6a0dad',
  darkColor: '#1a0040',
  textMuted: 'rgba(26,0,64,0.55)',
  cardBg: '#ffffff',
  cardBorder: 'rgba(106,13,173,0.08)',
  tagBg: 'rgba(26,0,64,0.1)',
  tagText: '#1a0040',
  tagBorder: 'rgba(26,0,64,0.18)',
  pillBg: '#f8f6ff',
  pillText: '#6a0dad',
}

export const engineeringPalette: PaletteConfig = {
  primaryBg: '#0a1628',
  accentColor: '#00C8B4',
  secondaryAccent: '#00A896',
  darkColor: '#0a1628',
  textMuted: 'rgba(255,255,255,0.55)',
  cardBg: '#0f1f35',
  cardBorder: 'rgba(0,200,180,0.12)',
  tagBg: 'rgba(0,200,180,0.1)',
  tagText: 'rgba(0,200,180,0.85)',
  tagBorder: 'rgba(0,200,180,0.2)',
  pillBg: 'rgba(0,200,180,0.08)',
  pillText: '#00C8B4',
}
