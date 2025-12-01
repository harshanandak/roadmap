/**
 * Shared animation variants for Work Board components
 * Uses framer-motion for smooth, staggered animations
 */

import type { Variants } from 'framer-motion'

// Stagger configuration
export const STAGGER_DELAY = 0.05 // 50ms between each child
export const ITEM_DURATION = 0.2 // 200ms for each item

/**
 * Container variants for staggered children animations
 * Apply to parent element that wraps animated items
 */
export const staggerContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER_DELAY,
      delayChildren: 0.1, // Small delay before first child animates
    },
  },
}

/**
 * Item variants for individual list items
 * Slides up and fades in
 */
export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ITEM_DURATION,
      ease: [0.4, 0, 0.2, 1], // Material Design easing
    },
  },
}

/**
 * Board card variants with scale effect
 * For Kanban-style boards
 */
export const boardCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 15,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: ITEM_DURATION,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

/**
 * Table row variants
 * Subtle slide from left
 */
export const tableRowVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -10,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: ITEM_DURATION,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

/**
 * Column container variants for board columns
 * Used to stagger cards within a column
 */
export const columnContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03, // Faster stagger for column items
      delayChildren: 0.05,
    },
  },
}

/**
 * Page/view transition variants
 * Slide up with fade
 */
export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1], // ease-in for exit
    },
  },
}
