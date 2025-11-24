import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function UniversalScanner({ onScan }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");

    // Get available cameras first
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          const cameraId = devices[0].id; // open rear camera
          html5QrCode.start(
            cameraId,
            {
              fps: 10,
              qrbox: 250,
            },
            (decodedText) => {
              console.log("SCAN RESULT: ", decodedText);
              onScan(decodedText);
            },
            (error) => {
              console.log("SCAN ERROR: ", error);
            }
          );
        }
      })
      .catch((err) => {
        console.error("CAMERA ERROR: ", err);
      });

    return () => {
      html5QrCode.stop().catch(() => {});
    };
  }, []);

  return (
    <div>
      <h3>Scan Any QR / Barcode</h3>
      <div
        id="reader"
        style={{
          width: "100%",
          maxWidth: "350px",
          margin: "auto",
        }}
      ></div>
    </div>
  );
}
