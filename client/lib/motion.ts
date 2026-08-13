import type { Transition } from "motion/react";

/** Shared Motion presets for ShelfLM operate surfaces. */
export const easeOutExpo: Transition = {
  duration: 0.48,
  ease: [0.16, 1, 0.3, 1],
};

export const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: easeOutExpo,
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { ...easeOutExpo, duration: 0.36 },
};

export const sealPress = {
  whileTap: { scale: 0.97, rotate: -0.4 },
  transition: easeOutExpo,
};

export const sealMarkEntrance = {
  initial: { opacity: 0, scale: 1.35, rotate: -8 },
  animate: { opacity: 1, scale: 1, rotate: -6 },
  transition: easeOutExpo,
};
