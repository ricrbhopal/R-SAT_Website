// UniversalScanner.jsx
import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

/**
 * Props:
 *  - onScan(decodedText: string) => void
 *  - preferredCameraId? (optional) - string camera id if you want to pick specific
 */
export default function UniversalScanner({ onScan, preferredCameraId = null }) {
  const containerId = "reader-box";
  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    async function startScanner() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!mountedRef.current) return;

        if (!devices || devices.length === 0) {
          console.error("[UniversalScanner] NO CAMERA FOUND!");
          return;
        }

        // try to pick preferredCameraId if provided and available
        let camObj = null;
        if (preferredCameraId) {
          camObj = devices.find((d) => d.id === preferredCameraId) || null;
        }
        if (!camObj) {
          // pick back camera if available, else first device
          camObj =
            devices.find((d) =>
              /back|rear|environment/i.test(d.label || "")
            ) || devices[0];
        }

        const camId = camObj.id;

        await scanner.start(
          camId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            // verbose: true, // enable if you want more logs from library
          },
          (decodedText) => {
            // decoded callback
            try {
              if (onScan) onScan(decodedText);
            } catch (e) {
              console.error("[UniversalScanner] onScan callback error:", e);
            }
          },
          (error) => {
            // optional callback for scan failure per frame
            // console.debug("scan frame error:", error);
          }
        );
        isRunningRef.current = true;
        console.info("[UniversalScanner] scanner started", camObj.label || camId);
      } catch (err) {
        console.error("[UniversalScanner] SCANNER ERROR:", err);
        // if start fails, ensure scanner resources are cleared
        try {
          await scanner.clear();
        } catch (e) {
          // ignore
        }
        isRunningRef.current = false;
      }
    }

    startScanner();

    return () => {
      mountedRef.current = false;
      const s = scannerRef.current;
      if (!s) return;

      (async () => {
        try {
          if (isRunningRef.current) {
            await s.stop();
            isRunningRef.current = false;
          }
        } catch (stopErr) {
          // ignore stop errors (most common when it wasn't started)
          console.warn("[UniversalScanner] stop() error ignored:", stopErr);
        } finally {
          try {
            await s.clear();
          } catch (clearErr) {
            // ignore
          }
        }
      })();
    };
  }, [onScan, preferredCameraId]);

  // container style: give size so html5-qrcode can render nicely
  return (
    <div
      id={containerId}
      style={{
        width: "100%",
        maxWidth: 480,
        height: 360,
        margin: "0 auto",
        borderRadius: 8,
        overflow: "hidden",
        background: "#000",
      }}
    />
  );
}
