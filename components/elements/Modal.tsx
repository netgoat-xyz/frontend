"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actionButtons?: React.ReactNode;
  onConfirm?: () => void;
}

const Modal = ({ isOpen, onClose, title, children, actionButtons, onConfirm }: ModalProps) => {
  
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
        <div className="fixed inset-0 z-100 flex items-center justify-center h-full p-4">
          
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
            className="relative bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300, duration: 0.2 }}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4 border-b border-neutral-800"
            >
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">✕</button>
            </div>

            {/* Body */}
            <div className="p-6 text-neutral-300">
              {children}
            </div>

            {/* Footer */}
            {(actionButtons || onConfirm) && (
              <div className="flex justify-end gap-3 p-4 border-t border-neutral-800 bg-neutral-900/50">
                {actionButtons ? actionButtons : (
                  <>
                    <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-400 font-medium hover:text-white transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 text-sm bg-white text-black font-medium rounded-md hover:bg-neutral-200 transition-colors">Confirm</button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;