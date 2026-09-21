import Image from "next/image";

/** Product photo, or a friendly bowl illustration when there is none. */
export function ProductImage({
  ean,
  hasImage,
  alt,
  size = 120,
  priority = false,
}: {
  ean: string;
  hasImage: boolean;
  alt: string;
  size?: number;
  priority?: boolean;
}) {
  if (hasImage && ean) {
    return (
      <Image
        src={`/products/${ean}.webp`}
        alt={alt}
        width={size}
        height={size}
        unoptimized
        priority={priority}
        className="h-full w-full object-contain"
      />
    );
  }
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label={alt} className="h-full w-full p-[18%] text-brand/35">
      <path d="M8 30h48c0 16-10 26-24 26S8 46 8 30z" fill="currentColor" />
      <circle cx="22" cy="18" r="4.5" fill="currentColor" />
      <circle cx="32" cy="14" r="4.5" fill="currentColor" />
      <circle cx="42" cy="18" r="4.5" fill="currentColor" />
    </svg>
  );
}
