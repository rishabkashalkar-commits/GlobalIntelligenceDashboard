export const CATEGORIES = [
  { id: 'politics',    label: 'Politics',    color: [59,130,246],  hex: '#3B82F6' },
  { id: 'economy',     label: 'Economy',     color: [245,158,11],  hex: '#F59E0B' },
  { id: 'conflict',    label: 'Conflict',    color: [239,68,68],   hex: '#EF4444' },
  { id: 'society',     label: 'Society',     color: [20,184,166],  hex: '#14B8A6' },
  { id: 'technology',  label: 'Technology',  color: [139,92,246],  hex: '#8B5CF6' },
  { id: 'sports',      label: 'Sports',      color: [34,197,94],   hex: '#22C55E' },
  { id: 'environment', label: 'Environment', color: [132,204,22],  hex: '#84CC16' },
]

export const TABS = ['all', ...CATEGORIES.map(c => c.id)]

export const REGION_MAP = {
  IR: 'middle_east', IQ: 'middle_east', SA: 'middle_east',
  AE: 'middle_east', IL: 'middle_east', JO: 'middle_east',
  LB: 'middle_east', YE: 'middle_east', SY: 'middle_east',
  IN: 'south_asia',  PK: 'south_asia',  BD: 'south_asia',
  LK: 'south_asia',  NP: 'south_asia',
  GB: 'europe', FR: 'europe', DE: 'europe',
  IT: 'europe', ES: 'europe', UA: 'europe', PL: 'europe',
  JP: 'east_asia', CN: 'east_asia', KR: 'east_asia', TW: 'east_asia',
  US: 'north_america', CA: 'north_america', MX: 'north_america',
}

export const COUNTRY_FLAGS = {
  US: '🇺🇸', GB: '🇬🇧', FR: '🇫🇷', DE: '🇩🇪', IN: '🇮🇳',
  CN: '🇨🇳', JP: '🇯🇵', AU: '🇦🇺', BR: '🇧🇷', RU: '🇷🇺',
  IR: '🇮🇷', SA: '🇸🇦', ZA: '🇿🇦', NG: '🇳🇬', EG: '🇪🇬',
  MX: '🇲🇽', AR: '🇦🇷', ID: '🇮🇩', PK: '🇵🇰', TR: '🇹🇷',
  CA: '🇨🇦', KR: '🇰🇷', ES: '🇪🇸', IT: '🇮🇹', UA: '🇺🇦',
  PL: '🇵🇱', AE: '🇦🇪', IL: '🇮🇱', TW: '🇹🇼', BD: '🇧🇩',
  LK: '🇱🇰', NP: '🇳🇵', IQ: '🇮🇶', SY: '🇸🇾', YE: '🇾🇪',
  JO: '🇯🇴', LB: '🇱🇧', GR: '🇬🇷', IE: '🇮🇪', PH: '🇵🇭',
  NL: '🇳🇱', BE: '🇧🇪', SE: '🇸🇪', NO: '🇳🇴', DK: '🇩🇰',
  FI: '🇫🇮', CH: '🇨🇭', AT: '🇦🇹', PT: '🇵🇹', NZ: '🇳🇿',
  SG: '🇸🇬', MY: '🇲🇾', TH: '🇹🇭', VN: '🇻🇳',
}

export const CATEGORY_COLORS = {
  politics:    [59,  130, 246],
  economy:     [245, 158, 11],
  conflict:    [239, 68,  68],
  society:     [20,  184, 166],
  technology:  [139, 92,  246],
  sports:      [34,  197, 94],
  environment: [132, 204, 22],
}
