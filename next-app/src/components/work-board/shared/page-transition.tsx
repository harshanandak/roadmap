'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { pageTransitionVariants } from './animation-variants'

interface PageTransitionProps {
  /**
   * Unique key for this view - triggers animation on change
   * Examples: 'dashboard', 'work-items', 'tasks', 'table', 'board'
   */
  viewKey: string
  children: React.ReactNode
  className?: string
}

/**
 * Page transition wrapper that animates view changes
 * Uses slide up + fade animation for smooth transitions
 *
 * @example
 * <PageTransition viewKey={currentView}>
 *   {viewContent}
 * </PageTransition>
 */
export function PageTransition({ viewKey, children, className }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Simplified variant for content that doesn't need exit animation
 * Useful for tab content within a parent AnimatePresence
 */
export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.2,
          delay,
          ease: [0.4, 0, 0.2, 1],
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
