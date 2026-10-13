"use client";

// Brand_Logo <img> (BUSINESS.logo) that falls back to the CSS "TG" Logo_Mark when
// the file is missing or fails to load (Req 33.1, 33.2).
import { useCallback, useState } from "react";
import { BUSINESS } from "@/lib/data";
import styles from "./LogoImage.module.css";

/**
 * @param {object} props
 * @param {number} [props.size=48] rendered height (and width) in px
 * @param {boolean} [props.priority=false] true for the Header logo (no lazy loading, Req 26.2)
 * @param {string} [props.className] extra class for the <img> / Logo_Mark
 */
export function LogoImage({ size = 48, priority = false, className }) {
  const [failed, setFailed] = useState(false);
  const { src, alt } = BUSINESS.logo;

  // The server-rendered <img> may have errored before hydration attached onError.
  const imgRef = useCallback((node) => {
    if (node && node.complete && node.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={className ? `${styles.mark} ${className}` : styles.mark}
        style={{ "--logo-size": `${size}px` }}
      >
        <span className={styles.initials} aria-hidden="true">
          {BUSINESS.logoInitials}
        </span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- onError fallback needs a plain <img>
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className ? `${styles.logo} ${className}` : styles.logo}
      style={{ "--logo-size": `${size}px` }}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default LogoImage;
