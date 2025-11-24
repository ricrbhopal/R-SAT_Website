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

      // start with given camera id
      await scanner.start(
        camId,
        {
          fps,
          qrbox: { width: 260, height: 260 },
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

  // UI
  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 rounded p-2">
            <svg
              className="w-5 h-5 text-gray-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M3 7h18M12 3v4M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-800">QR / Barcode Scanner</div>
            <div className="text-xs text-gray-500">{status === "running" ? "Ready — point camera at QR code" : status === "starting" ? "Starting camera..." : status === "no-camera" ? "No camera found" : status === "error" ? "Error" : "Idle"}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={async () => {
                await stopScanner();
                onClose();
              }}
              className="text-gray-600 hover:text-gray-800 text-sm px-2 py-1 rounded"
              title="Close"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Controls + viewer */}
      <div className="p-4 space-y-3">
        {/* Controls */}
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <label className="text-xs text-gray-500">Camera</label>
            <select
              className="mt-1 block w-full rounded border px-2 py-1 text-sm"
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

          <div style={{ minWidth: 92 }}>
            <label className="text-xs text-gray-500">FPS</label>
            <select
              className="mt-1 block w-full rounded border px-2 py-1 text-sm"
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div style={{ minWidth: 90 }}>
            <label className="text-xs text-gray-500">&nbsp;</label>
            <div className="mt-1">
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
                className={`w-full text-sm px-2 py-1 rounded border ${torchOn ? "bg-yellow-50 border-yellow-300" : "bg-white border-gray-200"}`}
                title="Toggle Torch"
              >
                {torchOn ? "Torch ON" : "Torch"}
              </button>
            </div>
          </div>
        </div>

        {/* Viewer area */}
        <div className="w-full rounded overflow-hidden bg-black flex items-center justify-center" style={{ height: 360 }}>
          {/* The actual scanner will render here */}
          <div id={containerId} style={{ width: "100%", height: "100%" }} />
          {/* overlay guide box */}
          <div className="pointer-events-none absolute w-full max-w-md">
            <div className="mx-auto mt-20" style={{ maxWidth: 480 }}>
              <div className="relative">
                <div className="border-2 border-dashed border-gray-300 rounded-md w-[260px] h-[260px] mx-auto" style={{ marginTop: 20 }} />
                <div className="absolute inset-0 flex items-start justify-center">
                  <div className="mt-8 text-xs text-white/90 bg-black/30 px-2 rounded">Align QR inside the box</div>
                </div>
              </div>
            </div>
          </div>
          {/* Confirmation dialog */}
          {showConfirm && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-xs w-full text-center">
                <div className="text-lg font-semibold mb-2">Scan Successful</div>
                <div className="text-gray-700 mb-4">Do you want to confirm this scan?</div>
                <div className="mb-4 break-words text-xs text-gray-500">{scanResult}</div>
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    setShowConfirm(false);
                    if (onScan) onScan(scanResult);
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>

        {/* status / errors */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {status === "running" ? "Scanning..." : status === "starting" ? "Starting camera..." : status === "no-camera" ? "No camera detected" : status === "error" ? "Error: " + errorMsg : "Awaiting start"}
          </div>
          <div className="flex items-center gap-2">
            {errorMsg && <div className="text-xs text-red-600">{errorMsg}</div>}
            <button
              className="text-sm px-3 py-1 rounded border bg-gray-50"
              onClick={async () => {
                setErrorMsg("");
                await stopScanner();
                if (selectedCamera) await startScanner(selectedCamera);
              }}
            >
              Restart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
