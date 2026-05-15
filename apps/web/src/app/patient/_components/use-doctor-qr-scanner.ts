"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
};

export type DoctorQrScannerMessages = {
  scannerUnavailable: string;
  qrUnreadable: string;
  cameraFailed: string;
  cameraPermissionDenied: string;
};

export function useDoctorQrScanner({
  messages,
  onScan,
}: {
  messages: DoctorQrScannerMessages;
  onScan: (rawValue: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const cameraSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    Boolean(
      (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector,
    );

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
      .BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setError(messages.scannerUnavailable);
      return;
    }

    setError(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setIsScanning(true);

      if (!videoRef.current) {
        stopCamera();
        setError(messages.cameraFailed);
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const detector = new Detector({ formats: ["qr_code"] });
      const scan = async () => {
        if (!videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const rawValue = codes[0]?.rawValue?.trim();
          if (rawValue) {
            stopCamera();
            onScan(rawValue);
            return;
          }
        } catch {
          setError(messages.qrUnreadable);
        }
        scanTimerRef.current = window.setTimeout(scan, 500);
      };

      await scan();
    } catch (cameraError) {
      stopCamera();
      setError(isPermissionDenied(cameraError) ? messages.cameraPermissionDenied : messages.cameraFailed);
    }
  }, [messages, onScan, stopCamera]);

  useEffect(() => stopCamera, [stopCamera]);

  return {
    cameraSupported,
    error,
    isScanning,
    setError,
    startCamera,
    stopCamera,
    videoRef,
  };
}

function isPermissionDenied(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "NotAllowedError" || error.name === "SecurityError")
  );
}
