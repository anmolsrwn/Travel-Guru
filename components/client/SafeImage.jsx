"use client";

// <img> with explicit width/height that swaps to a same-size gradient placeholder
// when the image fails to load (design 7.x "Images", Req 27.2, 26.2).
// Not next/image: admins can enter arbitrary allowed-host URLs and the onError
// fallback is required.
import { useCallback, useState } from "react";
import styles from "./SafeImage.module.css";

/**
 * @param {object} props
 * @param {string} props.src image URL
 * @param {string} props.alt alternative text ("" for decorative images)
 * @param {number} props.width intrinsic width in px (positive integer)
 * @param {number} props.height intrinsic height in px (positive integer)
 * @param {boolean} [props.priority=false] eager load + fetchPriority="high" (Hero only)
 * @param {string} [props.className] applied to the <img> and to the placeholder
 */
export function SafeImage({ src, alt, width, height, priority = false, className }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = !src || failedSrc === src;

  // Server-rendered images can fail before hydration attaches onError; detect that
  // case when React first gets the node (complete but no decoded pixels).
  const imgRef = useCallback(
    (node) => {
      if (node && node.complete && node.naturalWidth === 0) setFailedSrc(src);
    },
    [src],
  );

  if (failed) {
    const decorative = !alt;
    return (
      <span
        className={className ? `${styles.placeholder} ${className}` : styles.placeholder}
        style={{ aspectRatio: `${width} / ${height}` }}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : alt}
        aria-hidden={decorative ? "true" : undefined}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- onError fallback needs a plain <img>
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}

export default SafeImage;
