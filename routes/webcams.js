const express  = require('express')
const router   = express.Router()
// Note: webcamPresets are frontend-only; we serve them from a static object here
const { WEBCAM_PRESETS } = require('../../src/components/WebcamStrip/webcamPresets')

router.get('/:region', (req, res) => {
  const streams = WEBCAM_PRESETS[req.params.region] || []
  res.json({ region: req.params.region, streams })
})

module.exports = router
