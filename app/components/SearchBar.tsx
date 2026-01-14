'use client';

import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearchChange, placeholder = 'Search exercises...' }: SearchBarProps) {
  const [query, setQuery] = useState('');

  // Debounce search to avoid too many updates
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearchChange]);

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-5 sm:mb-6">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none">
        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}
