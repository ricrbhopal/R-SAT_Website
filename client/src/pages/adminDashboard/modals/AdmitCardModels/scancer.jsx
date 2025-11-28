// UniversalScanner.jsx
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import toast from "react-hot-toast";

/**
 * Props:
 *  - onScan(decodedText: string) => void
 *  - preferredCameraId? (optional) - string camera id if you want to pick specific
 *  - onClose? (optional) -> function to call when user clicks close
 *  - autoStart? (optional, default true) -> whether to start scanning on mount
 */
export default function UniversalScanner({
  onScan,
  preferredCameraId = null,
  onClose = null,
  autoStart = true,
}) {
  const containerId = "reader-box";
  const scannerRef = useRef(null);
  const mountedRef = useRef(true);
  const isRunningRef = useRef(false);

  const [devices, setDevices] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(preferredCameraId);
  const [fps, setFps] = useState(10);
  const [status, setStatus] = useState("idle"); // idle | starting | running | error | no-camera
  const [errorMsg, setErrorMsg] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [trackSupportsTorch, setTrackSupportsTorch] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // helper: attempt to get the active video track element
  const getActiveVideoTrack = () => {
    try {
      const video = document.querySelector(`#${containerId} video`);
      if (!video) return null;
      const stream = video.srcObject;
      if (!stream) return null;
      const tracks = stream.getVideoTracks();
      return tracks && tracks.length ? tracks[0] : null;
    } catch {
      return null;
    }
  };

  // try to toggling torch using MediaTrackConstraints (if supported)
  const toggleTorch = async () => {
    const track = getActiveVideoTrack();
    if (!track) return;
    const capabilities = track.getCapabilities?.();
    if (!capabilities || !capabilities.torch) {
      setErrorMsg("Torch not supported on this device/camera.");
      return;
    }
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((s) => !s);
    } catch (err) {
      console.error("[UniversalScanner] toggleTorch error", err);
      setErrorMsg("Unable to toggle torch.");
    }
  };

  // start scanner with chosen camera id
  const startScanner = async (camId) => {
    setErrorMsg("");
    setStatus("starting");
    try {
      // create scanner if not created
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }
      const scanner = scannerRef.current;

      // scanner.start will throw if called while running; make sure to stop first
      if (isRunningRef.current) {
        try {
          await scanner.stop();
        } catch (e) {
          // ignore
        }
        isRunningRef.current = false;
      }

      // Responsive QR box size
      const qrboxSize = isMobile ? 200 : 260;

      // start with given camera id
      await scanner.start(
        camId,
        {
          fps,
          qrbox: { width: qrboxSize, height: qrboxSize },
        },
        (decodedText) => {
          try {
            setScanResult(decodedText);
            setShowConfirm(true);
            toast.success("Scan successful! Click OK to confirm.", {
              duration: 4000,
              position: "top-center",
            });
          } catch (e) {
            console.error("[UniversalScanner] onScan callback error:", e);
          }
        },
        (err) => {
          // per-frame scanning error callback (usually safe to ignore)
        }
      );

      // small delay to check for torch capability on the active track
      setTimeout(() => {
        const track = getActiveVideoTrack();
        if (track) {
          const caps = track.getCapabilities?.();
          setTrackSupportsTorch(Boolean(caps && caps.torch));
        }
      }, 600);

      isRunningRef.current = true;
      setStatus("running");
      setTorchOn(false);
    } catch (err) {
      console.error("[UniversalScanner] start error:", err);
      setStatus("error");
      setErrorMsg(
        "Failed to start camera. Check permissions, HTTPS, or try another camera."
      );
      // ensure scanner cleared
      try {
        await scannerRef.current?.clear();
      } catch {}
      isRunningRef.current = false;
    }
  };

  const stopScanner = async () => {
    setStatus("idle");
    setTorchOn(false);
    try {
      const s = scannerRef.current;
      if (!s) return;
      if (isRunningRef.current) {
        await s.stop();
        isRunningRef.current = false;
      }
      await s.clear();
    } catch (err) {
      // ignore
      console.warn("[UniversalScanner] stop error ignored:", err);
    }
  };

  // populate cameras and auto-start if needed
  useEffect(() => {
    mountedRef.current = true;
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    (async () => {
      try {
        const cams = await Html5Qrcode.getCameras();
        if (!mountedRef.current) return;
        if (!cams || cams.length === 0) {
          setStatus("no-camera");
          setDevices([]);
          return;
        }
        setDevices(cams);
        // pick preferred camera if available, otherwise try environment/back or first
        const pick =
          (preferredCameraId &&
            cams.find((d) => d.id === preferredCameraId)?.id) ||
          (cams.find((d) => /back|rear|environment/i.test(d.label || ""))?.id) ||
          cams[0].id;
        setSelectedCamera(pick);
        if (autoStart) {
          await startScanner(pick);
        }
      } catch (err) {
        console.error("[UniversalScanner] getCameras error:", err);
        setStatus("error");
        setErrorMsg("Unable to enumerate cameras. Check permissions or HTTPS.");
      }
    })();

    return () => {
      mountedRef.current = false;
      (async () => {
        try {
          if (isRunningRef.current) {
            await scannerRef.current.stop();
            isRunningRef.current = false;
          }
        } catch (stopErr) {
          // ignore
        } finally {
          try {
            await scannerRef.current.clear();
          } catch {}
        }
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // restart scanner when selectedCamera or fps changes
  useEffect(() => {
    if (!selectedCamera) return;
    // restart with new settings
    (async () => {
      await stopScanner();
      await startScanner(selectedCamera);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCamera, fps]);

  // Responsive QR box size
  const qrboxSize = isMobile ? 200 : 260;

  // UI
  return (
    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden relative border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <svg
              className="w-6 h-6 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 7h18M12 3v4M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">QR / Barcode Scanner</div>
            <div className={`text-sm font-medium ${
              status === "running" ? "text-green-600" :
              status === "starting" ? "text-blue-600" :
              status === "no-camera" ? "text-yellow-600" :
              status === "error" ? "text-red-600" : "text-gray-600"
            }`}>
              {status === "running" ? "✓ Ready — point camera at QR code" : 
               status === "starting" ? "🔄 Starting camera..." : 
               status === "no-camera" ? "⚠️ No camera found" : 
               status === "error" ? "❌ Error" : "⏸️ Idle"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={async () => {
                await stopScanner();
                onClose();
              }}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-white/50 rounded-xl transition-all duration-200 font-medium text-sm"
              title="Close"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Controls + viewer */}
      <div className="p-6 space-y-4">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Camera</label>
            <select
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
              value={selectedCamera || ""}
              onChange={(e) => setSelectedCamera(e.target.value)}
            >
              {devices.length === 0 ? (
                <option value="">No cameras</option>
              ) : (
                devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label || d.id}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">FPS</label>
            <select
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
            >
              <option value={5}>5 FPS</option>
              <option value={10}>10 FPS</option>
              <option value={15}>15 FPS</option>
              <option value={20}>20 FPS</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Flash</label>
            <button
              onClick={async () => {
                try {
                  if (trackSupportsTorch) {
                    await toggleTorch();
                  } else {
                    setErrorMsg("Torch not supported for this camera.");
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              className={`w-full text-sm px-4 py-3 rounded-xl border-2 transition-all duration-200 font-semibold ${
                torchOn 
                  ? "bg-yellow-500 border-yellow-500 text-white shadow-lg shadow-yellow-500/25" 
                  : "bg-white border-gray-200 text-gray-700 hover:border-yellow-400 hover:bg-yellow-50"
              }`}
              title="Toggle Torch"
            >
              {torchOn ? "🔦 Flash ON" : "⚡ Flash"}
            </button>
          </div>
        </div>

        {/* Viewer area */}
        <div className="w-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black flex items-center justify-center relative" style={{ height: isMobile ? 300 : 400 }}>
          {/* The actual scanner will render here */}
          <div id={containerId} style={{ width: "100%", height: "100%" }} />
          
          {/* overlay guide box */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div 
                className="border-2 border-dashed border-white/30 rounded-xl backdrop-blur-sm bg-black/20"
                style={{ width: qrboxSize, height: qrboxSize }}
              />
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <div className="text-white/90 bg-black/50 px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
                  📷 Align QR inside the box
                </div>
              </div>
              
              {/* Animated scanning line */}
              {status === "running" && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan" />
              )}
            </div>
          </div>

          {/* Confirmation dialog */}
          {showConfirm && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full transform animate-scale-in">
                <div className="text-center mb-2">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">Scan Successful!</div>
                  <div className="text-gray-600 mb-4">Do you want to confirm this scan?</div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-6 max-h-32 overflow-y-auto">
                  <div className="text-sm text-gray-700 break-all font-mono">{scanResult}</div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
                    onClick={() => setShowConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25"
                    onClick={() => {
                      setShowConfirm(false);
                      if (onScan) onScan(scanResult);
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              status === "running" ? "bg-green-500 animate-pulse" :
              status === "starting" ? "bg-blue-500 animate-pulse" :
              status === "error" ? "bg-red-500" : "bg-gray-400"
            }`} />
            <div className="text-sm text-gray-700">
              {status === "running" ? "Scanning actively..." : 
               status === "starting" ? "Initializing camera..." : 
               status === "no-camera" ? "No camera device detected" : 
               status === "error" ? `Error: ${errorMsg}` : "Ready to start"}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {errorMsg && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                ⚠️ {errorMsg}
              </div>
            )}
            <button
              className="px-5 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-200 shadow-sm"
              onClick={async () => {
                setErrorMsg("");
                await stopScanner();
                if (selectedCamera) await startScanner(selectedCamera);
              }}
            >
              🔄 Restart
            </button>
          </div>
        </div>
      </div>

      {/* Add CSS for scanning animation */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(${qrboxSize}px); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        @keyframes scale-in {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}


// ojfsdakfdslklkdsfkfdsklfdkfsdkklsdfklmfdskl