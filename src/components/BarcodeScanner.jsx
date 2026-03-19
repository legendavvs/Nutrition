import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Loader2, AlertCircle } from 'lucide-react'

export default function BarcodeScanner({ onDetected }) {
  const [error, setError]   = useState('')
  const [starting, setStarting] = useState(true)
  const containerRef = useRef(null)
  const scannerRef   = useRef(null)

  useEffect(() => {
    const id = 'qr-reader'
    let scanner

    async function start() {
      try {
        scanner = new Html5Qrcode(id)
        scannerRef.current = scanner

        const cameras = await Html5Qrcode.getCameras()
        if (!cameras || cameras.length === 0) {
          setError('No camera found on this device.')
          setStarting(false)
          return
        }

        // Prefer environment-facing (back) camera
        const cam = cameras.find(c => /back|rear|environment/i.test(c.label)) || cameras[cameras.length - 1]

        await scanner.start(
          { deviceId: cam.id },
          { fps: 10, qrbox: { width: 250, height: 140 }, aspectRatio: 1.5 },
          (decodedText) => {
            onDetected(decodedText)
          },
          () => {} // ignore decode errors
        )
        setStarting(false)
      } catch (err) {
        console.error('[Scanner]', err)
        setError(err?.message || 'Failed to start camera. Please allow camera access.')
        setStarting(false)
      }
    }

    start()

    return () => {
      scannerRef.current?.stop().catch(() => {})
    }
  }, [onDetected])

  return (
    <div className="relative">
      {starting && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#121212] z-10 rounded-xl">
          <Loader2 size={28} className="animate-spin text-emerald-400" />
        </div>
      )}
      {error ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      ) : (
        <div
          id="qr-reader"
          ref={containerRef}
          className="w-full rounded-xl overflow-hidden"
          style={{ minHeight: 220 }}
        />
      )}
    </div>
  )
}
