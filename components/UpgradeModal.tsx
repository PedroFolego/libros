'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus close button when modal opens (focus trap entry point)
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-primary/20 backdrop-blur-md"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-modal-title"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl p-8 border border-brand-border shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="upgrade-modal-title" className="text-2xl font-display">Recurso Premium</h2>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Fechar"
                onClick={onClose}
                className="p-2 border border-brand-border rounded-lg text-brand-muted hover:text-brand-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center gap-4 mb-8">
              <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-brand-muted text-sm leading-relaxed">
                As recomendações com IA são exclusivas para assinantes Premium. Faça upgrade para receber sugestões personalizadas de livros com base no seu perfil de leitor.
              </p>
            </div>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-brand-primary text-white rounded-xl font-bold uppercase text-sm tracking-widest shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? 'Aguarde...' : 'Fazer upgrade'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
