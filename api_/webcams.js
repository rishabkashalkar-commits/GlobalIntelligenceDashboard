export default async function handler(req, res) {
  // Vercel routes files in /api/[name].js as /api/[name]
  const { country } = req.query
  const countryCode = country || 'US'

  const presets = {
    // ... same presets ...
    US: [
      { id: 'nyc-times-square', name: 'Times Square, NY', url: 'https://worldcam.eu/embed/usa/new-york/times-square' },
      { id: 'la-venice-beach', name: 'Venice Beach, CA', url: 'https://worldcam.eu/embed/usa/los-angeles/venice-beach' }
    ],
    GB: [
      { id: 'london-skyline', name: 'London Skyline', url: 'https://worldcam.eu/embed/united-kingdom/london/skyline' }
    ],
    // Fallback
    DEFAULT: [
      { id: 'world-view', name: 'Global View', url: 'https://worldcam.eu/embed/global' }
    ]
  }

  const results = presets[countryCode.toUpperCase()] || presets.DEFAULT
  res.status(200).json(results)
}
