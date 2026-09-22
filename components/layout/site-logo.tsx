"use client";

import Image from "next/image";
import Link from "next/link";
import { shopName } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function SiteLogo({
  href = "/",
  className,
  priority = false,
  size = "nav",
}: {
  href?: string | null;
  className?: string;
  priority?: boolean;
  size?: "nav" | "footer" | "hero";
}) {
  const name = shopName();
  const dims =
    size === "hero"
      ? { width: 560, height: 160, className: "h-auto w-[min(88vw,28rem)] md:w-[min(70vw,34rem)]" }
      : size === "footer"
        ? { width: 220, height: 64, className: "h-12 w-auto" }
        : { width: 160, height: 46, className: "h-9 w-auto sm:h-10" };

  const image = (
    <Image
      src="/logo.png"
      alt={name}
      width={dims.width}
      height={dims.height}
      priority={priority}
      className={cn(dims.className, "object-contain object-left")}
    />
  );

  if (!href) {
    return <div className={cn("inline-flex", className)}>{image}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 opacity-95 transition-opacity duration-500 ease-soft hover:opacity-100",
        className
      )}
      aria-label={name}
    >
      {image}
    </Link>
  );
}
