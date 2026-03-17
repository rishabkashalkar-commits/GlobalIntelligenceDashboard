import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

export default function WebcamTile({ stream }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (!stream.hlsUrl || !videoRef.current) return
    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(stream.hlsUrl)
      hls.attachMedia(videoRef.current)
      return () => hls.destroy()
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = stream.hlsUrl
    }
  }, [stream.hlsUrl])

  return (
    <div className="relative rounded-lg overflow-hidden bg-surfaceAlt border border-borderSubtle flex-1 min-w-0">

      {/* Live indicator */}
      <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
        <span className="font-mono text-[9px] text-live font-medium">LIVE</span>
      </div>

      {stream.hlsUrl ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay muted playsInline
        />
      ) : (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${stream.youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={stream.label}
        />
      )}

      {/* Bottom label */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 px-2 py-1.5"
        style={{ background: 'linear-gradient(to top, rgba(5,13,26,0.95), transparent)' }}
      >
        <p className="font-mono text-[10px] text-textPrimary font-medium leading-none">
          {stream.city}
        </p>
        <p className="font-mono text-[9px] text-textMuted leading-none mt-0.5">
          {stream.label}
        </p>
      </div>
    </div>
  )
}
