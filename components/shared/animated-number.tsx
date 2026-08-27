"use client";

import * as React from "react";
import { animate, useMotionValue } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";

/**
 * Counts a key metric up on mount and on change. Motion here communicates that
 * the number is live rather than decorating it, and it is skipped entirely when
 * the reader has asked for reduced motion — in which case the value is rendered
 * directly rather than driven through state.
 */
export function AnimatedNumber({
  value,
  format,
  duration = 0.9,
}: {
  value: number;
  format: (value: number) => string;
  duration?: number;
}) {
  const reduced = usePrefersReducedMotion();
  return reduced ? (
    <span className="tabular">{format(value)}</span>
  ) : (
    <CountingNumber value={value} format={format} duration={duration} />
  );
}

function CountingNumber({
  value,
  format,
  duration,
}: {
  value: number;
  format: (value: number) => string;
  duration: number;
}) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = React.useState(() => format(0));

  React.useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(format(latest)),
    });
    return () => controls.stop();
  }, [value, duration, format, motionValue]);

  return (
    <span className="tabular">
      <span aria-hidden>{display}</span>
      {/* The final value is always announced, whatever the animation is doing. */}
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
