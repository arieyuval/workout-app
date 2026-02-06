'use client';

import { useState, useEffect, useRef } from 'react';
import { parseTimeToMinutes, formatMinutesToTime, validateTimeString } from '@/lib/time-utils';

interface TimeInputProps {
  value: number; // Decimal minutes
  onChange: (minutes: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
  showConversion?: boolean; // Show "= X.XX min" below input
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
}

export default function TimeInput({
  value,
  onChange,
  placeholder = 'e.g., 2345 or 23:45',
  disabled = false,
  className = '',
  id,
  autoFocus = false,
  onBlur,
  showConversion = false,
  onClick,
}: TimeInputProps) {
  // Display value (time string)
  const [displayValue, setDisplayValue] = useState<string>('');
  // Validation error
  const [error, setError] = useState<string | null>(null);
  // Track if user is actively editing
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize display value from prop value
  useEffect(() => {
    if (!isFocused && value > 0) {
      setDisplayValue(formatMinutesToTime(value));
    } else if (!isFocused && value === 0) {
      setDisplayValue('');
    }
  }, [value, isFocused]);

  // Auto-format input with colons as user types
  const formatTimeInput = (input: string): string => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');

    // Limit to 6 digits max (HH:MM:SS)
    const limited = digits.slice(0, 6);

    if (limited.length === 0) return '';
    if (limited.length <= 2) return limited; // "12"
    if (limited.length <= 4) {
      // "123" → "1:23" or "1234" → "12:34"
      return `${limited.slice(0, limited.length - 2)}:${limited.slice(-2)}`;
    }
    // "12345" → "1:23:45" or "123456" → "12:34:56"
    return `${limited.slice(0, limited.length - 4)}:${limited.slice(-4, -2)}:${limited.slice(-2)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    // Auto-format the input
    const formatted = formatTimeInput(input);
    setDisplayValue(formatted);

    // Adjust cursor position after formatting
    // If user is typing at the end, keep cursor at the end
    if (cursorPosition >= input.length) {
      setTimeout(() => {
        inputRef.current?.setSelectionRange(formatted.length, formatted.length);
      }, 0);
    }

    // Clear error while typing
    if (error) setError(null);
  };

  const handleBlur = () => {
    setIsFocused(false);

    if (!displayValue.trim()) {
      onChange(0);
      setError(null);
      onBlur?.();
      return;
    }

    // Validate and convert
    const validationError = validateTimeString(displayValue);
    if (validationError) {
      setError(validationError);
      onBlur?.();
      return;
    }

    const minutes = parseTimeToMinutes(displayValue);
    if (minutes !== null) {
      onChange(minutes);
      setDisplayValue(formatMinutesToTime(minutes)); // Normalize format
      setError(null);
    } else {
      setError('Invalid time format');
    }

    onBlur?.();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Submit on Enter
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric" // Show numeric keyboard on mobile
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onClick={onClick}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`${className} ${error ? 'border-red-500 dark:border-red-500' : ''}`}
      />

      {/* Validation error */}
      {error && (
        <div className="absolute text-xs text-red-600 dark:text-red-400 mt-1">
          {error}
        </div>
      )}

      {/* Optional conversion display */}
      {showConversion && value > 0 && !error && !isFocused && (
        <div className="absolute text-xs text-gray-500 dark:text-gray-400 mt-1">
          = {value.toFixed(2)} min
        </div>
      )}
    </div>
  );
}
