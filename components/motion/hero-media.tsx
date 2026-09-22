"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Plays /bg_video.mp4 when present, otherwise keeps the still banner.
 * Both layers get a slow parallax drift tied to scroll position.
 */
export function HeroMedia({ alt }: { alt: string }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [allowVideo, setAllowVideo] = useState(false);

  useEffect(() => {
    // effectiveType is unreliable right after load, so only honour the explicit opt-out.
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    setAllowVideo(connection?.saveData !== true);
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const offset = Math.min(window.scrollY, 900);
        layer.style.transform = `translate3d(0, ${offset * 0.22}px, 0) scale(${
          1 + offset * 0.00012
        })`;
        layer.style.opacity = String(Math.max(1 - offset / 1400, 0.45));
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={layerRef} className="absolute inset-0 will-change-transform">
      <Image
        src="/banner.jpg"
        alt={alt}
        fill
        priority
        quality={90}
        sizes="100vw"
        className={`object-cover object-center transition-opacity duration-1000 ease-soft md:object-[center_42%] ${
          videoReady ? "opacity-0" : "animate-ken-burns-soft opacity-100"
        }`}
      />

      {allowVideo && !videoFailed && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/banner.jpg"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-soft ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src="/bg_video.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}
