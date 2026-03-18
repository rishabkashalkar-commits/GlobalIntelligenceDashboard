import { WEBCAM_PRESETS } from './webcamPresets'
import { REGION_MAP } from '../../lib/constants'
import WebcamTile from './WebcamTile'

export default function WebcamStrip() {
  const { webcamStreams } = useGlobeStore()

  if (!webcamStreams || !webcamStreams.length) return null

  return (
    <div className="flex-shrink-0 border-t border-borderSubtle bg-base">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-borderSubtle">
        <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
        <span className="font-mono text-[9px] text-textMuted tracking-widest uppercase">
          Live Feeds
        </span>
      </div>
      <div className="flex gap-2 px-3 py-2 h-[150px]">
        {streams.slice(0, 3).map((stream, i) => (
          <WebcamTile key={i} stream={stream} />
        ))}
      </div>
    </div>
  )
}
