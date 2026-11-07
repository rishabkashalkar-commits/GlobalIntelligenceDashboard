import { useEffect, useRef, useState } from 'react'
import Globe from 'globe.gl'
import * as THREE from 'three'
import useGlobeStore from '../../store/useGlobeStore'
import MarkerLayer, { resetMarkers } from './MarkerLayer'
import MarkerTooltip from './MarkerTooltip'

// Natural Earth leaves a few ISO_A2 codes as -99
const ISO_FALLBACK = { France: 'FR', Norway: 'NO' }
const featureCode = (f) => {
  const p = f.properties || {}
  return p.ISO_A2 && p.ISO_A2 !== '-99' ? p.ISO_A2 : ISO_FALLBACK[p.ADMIN] || null
}

// Dot palette, drawn from the dashboard's accent colours
const DOT_A = new THREE.Color('#63b3ed') // accent blue
const DOT_B = new THREE.Color('#4fd1c5') // accent teal
const DOT_C = new THREE.Color('#c7dcff') // icy highlight
const DOT_SELECTED = 'rgba(241, 245, 249, 1)'

function featureCentroid(f) {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
  const walk = (c) => {
    if (typeof c[0] === 'number') {
      minLng = Math.min(minLng, c[0]); maxLng = Math.max(maxLng, c[0])
      minLat = Math.min(minLat, c[1]); maxLat = Math.max(maxLat, c[1])
    } else c.forEach(walk)
  }
  walk(f.geometry.coordinates)
  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2]
}

function dotColor(f) {
  const [lat, lng] = featureCentroid(f)
  // west→east sweeps blue→teal; higher latitudes lift toward icy white
  const c = DOT_A.clone().lerp(DOT_B, (Math.sin((lng * Math.PI) / 180) + 1) / 2 * 0.7)
  c.lerp(DOT_C, Math.min(1, Math.abs(lat) / 70) * 0.55)
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, 0.8)`
}

function makeGlowTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  // Sprite spans 320 units; globe radius is 100 → edge at ~0.625 of the gradient radius
  g.addColorStop(0.0, 'rgba(79, 143, 255, 0.0)')
  g.addColorStop(0.58, 'rgba(79, 143, 255, 0.0)')
  g.addColorStop(0.63, 'rgba(99, 179, 237, 0.30)')
  g.addColorStop(0.75, 'rgba(79, 143, 255, 0.10)')
  g.addColorStop(1.0, 'rgba(79, 143, 255, 0.0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

function makeStarfield(count = 2200) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const tint = new THREE.Color()
  for (let i = 0; i < count; i++) {
    const r = 900 + Math.random() * 600
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
    const b = 0.3 + Math.random() * 0.6
    tint.set(Math.random() > 0.8 ? '#a5c8ff' : '#e2e8f0').multiplyScalar(b)
    colors.set([tint.r, tint.g, tint.b], i * 3)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const mat = new THREE.PointsMaterial({
    size: 1.4,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  })
  return new THREE.Points(geo, mat)
}

export default function GlobeComponent() {
  const containerRef = useRef(null)
  const globeInstanceRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [countriesReady, setCountriesReady] = useState(false)
  const articles = useGlobeStore(s => s.articles)
  const activeLayers = useGlobeStore(s => s.activeLayers)
  const selectedCountry = useGlobeStore(s => s.selectedCountry)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const { setSelectedCountry, openPanel } = useGlobeStore.getState()

    const globeMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color('#06142a'),
      emissive: new THREE.Color('#0a1f3d'),
      emissiveIntensity: 0.55,
      shininess: 8,
    })

    const globe = Globe()(container)
      .backgroundColor('#050d1a')
      .globeMaterial(globeMaterial)
      .showGraticules(false)
      .atmosphereColor('#4f8fff')
      .atmosphereAltitude(0.25)
      .enablePointerInteraction(true)

    // Softer key light so the dot matrix reads evenly
    globe.lights().forEach(l => {
      if (l.isDirectionalLight) l.intensity *= 0.5
    })

    // Outer halo + starfield
    const glowTex = makeGlowTexture()
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }))
    glow.scale.set(320, 320, 1)
    globe.scene().add(glow)

    const stars = makeStarfield()
    globe.scene().add(stars)

    let raf
    const drift = () => {
      stars.rotation.y += 0.00008
      raf = requestAnimationFrame(drift)
    }
    drift()

    // Camera + controls
    globe.pointOfView({ lat: 25, lng: 10, altitude: 2.2 })
    const controls = globe.controls()
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.3
    controls.enableDamping = true
    controls.addEventListener('start', () => { controls.autoRotate = false })

    // Dotted landmass
    let cancelled = false
    fetch('/countries.geojson')
      .then(r => r.json())
      .then(({ features }) => {
        if (cancelled) return
        features.forEach(f => {
          f.__code = featureCode(f)
          f.__color = dotColor(f)
        })
        globe
          .hexPolygonsData(features)
          .hexPolygonResolution(3)
          .hexPolygonMargin(0.55)
          .hexPolygonUseDots(true)
          .hexPolygonDotResolution(6)
          .hexPolygonAltitude(0.002)
          .hexPolygonColor(f => f.__color)
          .onHexPolygonClick(f => {
            if (!f?.__code) return
            useGlobeStore.getState().setActiveCategory('all')
            setSelectedCountry(f.__code)
            openPanel()
          })
        setCountriesReady(true)
      })
      .catch(err => console.error('Failed to load country dots', err))

    // Ocean click → reverse geocode (debounced)
    let clickTimeout = null
    globe.onGlobeClick(({ lat, lng }) => {
      clearTimeout(clickTimeout)
      clickTimeout = setTimeout(() => {
        reverseGeocode(lat, lng).then(isoCode => {
          if (isoCode) {
            setSelectedCountry(isoCode)
            openPanel()
          }
        })
      }, 100)
    })

    // Resize to fit container (container width changes when the panel opens)
    const handleResize = () => {
      globe.width(container.clientWidth)
      globe.height(container.clientHeight)
    }
    handleResize()
    const ro = new ResizeObserver(handleResize)
    ro.observe(container)

    globeInstanceRef.current = globe

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      clearTimeout(clickTimeout)
      ro.disconnect()
      globe.scene().remove(glow, stars)
      glowTex.dispose()
      glow.material.dispose()
      stars.geometry.dispose()
      stars.material.dispose()
      globeMaterial.dispose()
      resetMarkers()
      globe._destructor?.()
      globeInstanceRef.current = null
    }
  }, [])

  // Highlight the selected country's dots
  useEffect(() => {
    const globe = globeInstanceRef.current
    if (!globe || !countriesReady) return
    globe.hexPolygonColor(f =>
      selectedCountry && f.__code === selectedCountry ? DOT_SELECTED : f.__color
    )
  }, [selectedCountry, countriesReady])

  // Event markers
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
