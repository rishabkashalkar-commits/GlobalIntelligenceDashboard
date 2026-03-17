import { useEffect, useRef, useState } from 'react'
import Globe from 'globe.gl'
import useGlobeStore from '../../store/useGlobeStore'
import MarkerLayer from './MarkerLayer'
import MarkerTooltip from './MarkerTooltip'

export default function GlobeComponent() {
  const containerRef = useRef(null)
  const globeInstanceRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const { setSelectedCountry, openPanel, articles, activeLayers } = useGlobeStore()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const globe = Globe()(container)
      .globeImageUrl('/earth-night.jpg')
      .backgroundColor('#050d1a')
      .atmosphereColor('#63b3ed')
      .atmosphereAltitude(0.15)
      .enablePointerInteraction(true)

    // Auto-rotate when idle
    globe.controls().autoRotate = true
    globe.controls().autoRotateSpeed = 0.3
    globe.controls().enableDamping = true

    // Stop rotation on user interaction
    globe.controls().addEventListener('start', () => {
      globe.controls().autoRotate = false
    })

    // Country click → open news panel (Debounced 100ms)
    const clickTimeout = { current: null }
    globe.onGlobeClick(({ lat, lng }) => {
      console.log('Globe clicked:', { lat, lng })
      if (clickTimeout.current) clearTimeout(clickTimeout.current)
      clickTimeout.current = setTimeout(() => {
        reverseGeocode(lat, lng).then(isoCode => {
          console.log('Reverse geocode result:', isoCode)
          if (isoCode) {
            setSelectedCountry(isoCode)
            openPanel()
          }
        })
      }, 100)
    })

    // Resize to fit container
    const handleResize = () => {
      if (container) {
        globe.width(container.clientWidth)
        globe.height(container.clientHeight)
      }
    }
    globe.width(container.clientWidth)
    globe.height(container.clientHeight)

    globeInstanceRef.current = globe

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      globe._destructor?.()
    }
  }, [])

  // Inject deck.gl marker layer when articles change
  useEffect(() => {
    if (!globeInstanceRef.current) return
    MarkerLayer(globeInstanceRef.current, articles, setTooltip)
  }, [articles, activeLayers])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {tooltip && <MarkerTooltip tooltip={tooltip} />}
    </div>
  )
}

// Reverse geocode using Nominatim
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    )
    const data = await res.json()
    return data.address?.country_code?.toUpperCase() || null
  } catch {
    return null
  }
}
