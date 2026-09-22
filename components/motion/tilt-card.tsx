"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Subtle 3D tilt that tracks the pointer. */
export function TiltCard({
  children,
  className,
  max = 7,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const onMove = (event: MouseEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(1100px) rotateY(${px * max}deg) rotateX(${
          -py * max
        }deg) translateY(-6px)`;
        el.style.setProperty("--gx", `${(px + 0.5) * 100}%`);
        el.style.setProperty("--gy", `${(py + 0.5) * 100}%`);
      });
    };
    const onLeave = () => {
      el.style.transform = "";
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [max]);

  return (
    <div ref={ref} className={cn("tilt-card", className)}>
      {children}
    </div>
  );
}
