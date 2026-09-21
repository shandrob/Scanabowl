"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/i18n/DictionaryProvider";
import { IconX } from "@/components/ui/Icons";

type Detector = { detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };

/**
 * Camera barcode scanner. Uses the browser's built-in BarcodeDetector when it exists
 * (Chrome/Android) and a small WebAssembly fallback everywhere else (e.g. iPhone Safari).
 * The camera image never leaves the phone.
 */
export function BarcodeScanner({ onDetect, onClose }: { onDetect: (code: string) => void; onClose: () => void }) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"starting" | "scanning" | "denied" | "unsupported">("starting");
  const doneRef = useRef(false);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    let stream: MediaStream | null = null;

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setStatus("unsupported");
          return;
        }
        const formats = ["ean_13", "ean_8", "upc_a", "upc_e"];
        const native = (globalThis as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
        let detector: Detector;
        if (native) detector = new native({ formats });
        else {
          const mod = await import("barcode-detector/ponyfill");
          detector = new mod.BarcodeDetector({ formats: formats as never }) as unknown as Detector;
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false,
        });
        if (stopped) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStatus("scanning");
        const tick = async () => {
          if (stopped || doneRef.current) return;
          try {
            const codes = await detector.detect(video);
            const hit = codes.find((c) => /^\d{8,14}$/.test(c.rawValue));
            if (hit) {
              doneRef.current = true;
              onDetect(hit.rawValue);
              return;
            }
          } catch {
            /* a frame that cannot be decoded is normal */
          }
          timer = window.setTimeout(tick, 180);
        };
        tick();
      } catch (e) {
        const name = (e as { name?: string })?.name;
        setStatus(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unsupported");
      }
    })();

    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      stream?.getTracks().forEach((tr) => tr.stop());
      document.removeEventListener("keydown", esc);
    };
  }, [onDetect, onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={t("scan.title")} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-paper shadow-lift">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-brand-deep">{t("scan.title")}</h2>
          <button type="button" onClick={onClose} aria-label={t("common.close")} className="rounded-lg p-2 text-ink-soft hover:bg-cream">
            <IconX />
          </button>
        </div>
        <div className="relative aspect-[4/3] bg-black">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          {status === "scanning" && (
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
              <div className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 bg-red-500/80" />
            </div>
          )}
        </div>
        <p className="px-4 py-3 text-sm text-ink-soft" role="status">
          {status === "starting" && t("scan.starting")}
          {status === "scanning" && t("scan.hint")}
          {status === "denied" && t("scan.denied")}
          {status === "unsupported" && t("scan.unsupported")}
        </p>
      </div>
    </div>
  );
}
