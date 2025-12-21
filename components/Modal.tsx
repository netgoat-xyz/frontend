"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  layoutId: string; // The key to the "origin" animation
}

const Modal = ({ isOpen, onClose, title, children, layoutId }: ModalProps) => {
  
  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Lock Scroll
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    }
  }, [isOpen]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* Backdrop Fade */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content - The "Origin" Animation */}
          <motion.div 
            layoutId={layoutId} // Must match the button's layoutId
            className="relative bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden"
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between p-4 border-b border-neutral-800"
            >
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">✕</button>
            </motion.div>

            {/* Body */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.15 }}
              className="p-6 text-neutral-300"
            >
              {children}
            </motion.div>

            {/* Footer */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.2 }}
              className="flex justify-end gap-3 p-4 border-t border-neutral-800 bg-neutral-900/50"
            >
              <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-400">Cancel</button>
              <button className="px-4 py-2 text-sm bg-white text-black rounded-md">Confirm</button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;