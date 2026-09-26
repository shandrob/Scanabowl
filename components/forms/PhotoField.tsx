"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/DictionaryProvider";

/** A photo ready to send: base64 JPEG without the "data:" prefix. */
export interface PhotoDraft {
  name: string;
  type: string;
  data: string;
  preview: string;
}

export const MAX_PHOTOS = 4;
const MAX_SIDE = 1600;
/** Per photo after compression; 4 photos must stay under the ~4.5 MB request limit of the host. */
const MAX_BYTES = 700_000;

/** Shrink a phone photo to at most 1600 px and ~700 KB before it is sent, so uploads stay fast. */
async function shrink(file: File): Promise<PhotoDraft> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let quality = 0.82;
  let url = canvas.toDataURL("image/jpeg", quality);
  while (url.length * 0.75 > MAX_BYTES && quality > 0.4) {
    quality -= 0.12;
    url = canvas.toDataURL("image/jpeg", quality);
  }
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9_-]+/g, "-").slice(0, 40) || "foto";
  return { name: `${base}.jpg`, type: "image/jpeg", data: url.slice(url.indexOf(",") + 1), preview: url };
}

/** "Take a photo of the pack" - saves visitors from typing the ingredient list. */
export function PhotoField({
  idPrefix,
  photos,
  onChange,
  permission,
  onPermission,
  error,
}: {
  idPrefix: string;
  photos: PhotoDraft[];
  onChange: (p: PhotoDraft[]) => void;
  permission: boolean;
  onPermission: (v: boolean) => void;
  error?: string;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setProblem(null);
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) setProblem(t("forms.photosLimit", { max: MAX_PHOTOS }));
    setBusy(true);
    const next = [...photos];
    for (const f of [...files].slice(0, Math.max(0, room))) {
      try {
        next.push(await shrink(f));
      } catch {
        setProblem(t("forms.photosError"));
      }
    }
    onChange(next);
    setBusy(false);
  };

  return (
    <div>
      <p className="block text-[0.95rem] font-semibold text-ink">{t("forms.photos")}</p>
      <p className="mt-1 text-sm text-ink-soft">{t("forms.photosHint")}</p>
      <ul className="mt-3 flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <li key={`${p.name}-${i}`} className="relative h-24 w-24 overflow-hidden rounded-xl border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a photo that is not uploaded anywhere yet */}
            <img src={p.preview} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 rounded-full bg-ink/80 px-2 py-0.5 text-xs font-semibold text-white"
              aria-label={t("forms.photosRemove")}
            >
              ×
            </button>
          </li>
        ))}
        {photos.length < MAX_PHOTOS && (
          <li>
            <label
              htmlFor={`${idPrefix}-photos`}
              className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand/40 bg-brand-tint text-center text-xs font-semibold text-brand hover:border-brand"
            >
              <span className="text-2xl leading-none" aria-hidden>+</span>
              {busy ? t("forms.sending") : t("forms.photosAdd")}
            </label>
            <input
              id={`${idPrefix}-photos`}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                void add(e.target.files);
                e.target.value = "";
              }}
            />
          </li>
        )}
      </ul>
      {(problem || error) && <p className="mt-2 text-sm font-semibold text-danger">{problem ?? error}</p>}
      {photos.length > 0 && (
        <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
          <input type="checkbox" className="mt-0.5 h-5 w-5 rounded accent-brand" checked={permission} onChange={(e) => onPermission(e.target.checked)} />
          <span>{t("forms.photoPermission")}</span>
        </label>
      )}
    </div>
  );
}
