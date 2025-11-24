import React, { useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function UniversalScanner({ onScan }) {
  useEffect(() => {
    const id = "reader-box";
    const scanner = new Html5Qrcode(id);

    let mounted = true;

    async function startScanner() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!mounted) return;

        if (!devices || devices.length === 0) {
          console.error("NO CAMERA FOUND!");
          return;
        }

        const camId = devices[0].id;

        await scanner.start(
          camId,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (text) => onScan(text),
          () => {}
        );
      } catch (err) {
        console.error("SCANNER ERROR:", err);
      }
    }

    startScanner();

    return () => {
      mounted = false;
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, []);

  return (
    <div
      id="reader-box"
      style={{ width: "300px", height: "300px", margin: "auto" }}
    ></div>
  );
}
