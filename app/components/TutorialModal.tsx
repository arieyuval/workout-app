'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOTAL_STEPS = 7;

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const handleContinue = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image area with arrows */}
        <div className="relative flex items-center justify-center p-4 pt-10">
          {/* Left arrow */}
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="absolute left-2 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Tutorial image */}
          <div className="w-full flex justify-center">
            <Image
              src={`/tutorial/${currentStep + 1}.png`}
              alt={`Tutorial step ${currentStep + 1}`}
              width={350}
              height={600}
              className="rounded-md object-contain max-h-[55vh]"
              priority
            />
          </div>

          {/* Right arrow */}
          {currentStep < TOTAL_STEPS - 1 && (
            <button
              onClick={handleContinue}
              className="absolute right-2 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 py-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentStep
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Continue + Skip buttons */}
        <div className="px-4 pb-4 pt-2">
          <button
            onClick={handleContinue}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            {currentStep < TOTAL_STEPS - 1 ? 'Continue' : 'Get Started'}
          </button>
          <button
            onClick={handleClose}
            className="w-full mt-2 py-1 text-sm text-gray-500 dark:text-gray-400 underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </>
  );
}
