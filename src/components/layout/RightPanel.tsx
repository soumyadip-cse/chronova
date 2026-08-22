'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RightPanelProps {
  isOpen: boolean
  onClose: () => void
  content?: React.ReactNode
  title?: string
}

export function RightPanel({ isOpen, onClose, content, title }: RightPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed right-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-96 bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-xl lg:relative lg:z-auto lg:top-0 lg:h-screen lg:shadow-none"
            role="complementary"
            aria-label="Details panel"
          >
            <div className="flex h-full flex-col">
              <div className="flex h-14 items-center justify-between border-b border-border/50 px-4">
                <h2 className="font-heading text-lg font-semibold">{title || 'Details'}</h2>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {content}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}