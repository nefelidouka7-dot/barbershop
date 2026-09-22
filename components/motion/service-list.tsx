"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";

export type ServiceRow = {
  id: string;
  name: string;
  meta: string;
  price: string;
  image: string;
};

/** Menu rows with an image that trails the cursor over the hovered row. */
export function ServiceList({ items }: { items: ServiceRow[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const peek = peekRef.current;
    if (!wrap || !peek) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let frame = 0;
    const onMove = (event: MouseEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const rect = wrap.getBoundingClientRect();
        peek.style.transform = `translate3d(${event.clientX - rect.left}px, ${
          event.clientY - rect.top
        }px, 0)`;
      });
    };

    wrap.addEventListener("mousemove", onMove);
    return () => {
      wrap.removeEventListener("mousemove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative" onMouseLeave={() => setActive(null)}>
      <div
        ref={peekRef}
        className={`peek pointer-events-none absolute left-0 top-0 z-20 hidden lg:block ${
          active !== null ? "is-on" : ""
        }`}
        aria-hidden
      >
        <div className="peek-inner relative h-52 w-40 overflow-hidden">
          {items.map((item, i) => (
            <Image
              key={item.id}
              src={item.image}
              alt=""
              fill
              sizes="160px"
              className={`object-cover transition-opacity duration-500 ease-soft ${
                active === i ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
      </div>

      <ul className="divide-y divide-border border-y border-border">
        {items.map((item, i) => (
          <Reveal key={item.id} delay={i * 80} from="left">
            <li
              onMouseEnter={() => setActive(i)}
              className={`menu-row group flex flex-wrap items-baseline justify-between gap-3 py-5 transition-opacity duration-500 ease-soft md:gap-4 md:py-6 ${
                active !== null && active !== i ? "lg:opacity-35" : "opacity-100"
              }`}
            >
              <div className="flex items-baseline gap-4 md:gap-6">
                <span className="font-display text-sm text-primary/60 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-display text-2xl transition-colors duration-500 ease-soft group-hover:text-primary md:text-4xl">
                    {item.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.meta}
                  </p>
                </div>
              </div>
              <p className="font-display text-2xl text-primary transition-transform duration-500 ease-soft group-hover:-translate-x-1 md:text-3xl">
                {item.price}
              </p>
            </li>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
