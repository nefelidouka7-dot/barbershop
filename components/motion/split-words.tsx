"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Reveals a line word by word once it scrolls into view. */
export function SplitWords({
  text,
  className,
  wordClassName,
  delay = 0,
  step = 55,
}: {
  text: string;
  className?: string;
  /** Applied to each word. Use for effects that need their own text box, e.g. gradient fills. */
  wordClassName?: string;
  delay?: number;
  step?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = text.split(" ");

  return (
    <span ref={ref} className={cn("split-words", className)}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="split-word">
            <span
              className={cn(
                "split-word-inner",
                wordClassName,
                visible && "is-in"
              )}
              style={{ transitionDelay: `${delay + i * step}ms` }}
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
