'use client';

import Link from 'next/link';
import Image from 'next/image';
import { History, Scale } from 'lucide-react';
import UserMenu from './UserMenu';

export default function NavBar() {
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left side - Nav Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/history"
              className="flex items-center gap-1.5 px-2 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="History"
            >
              <History className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">History</span>
            </Link>
            <Link
              href="/weight"
              className="flex items-center gap-1.5 px-2 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Body Weight"
            >
              <Scale className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Body Weight</span>
            </Link>
          </div>

          {/* Center - Logo and Title */}
          <Link
            href="/"
            className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
          >
            <Image
              src="/plates-logo.png"
              alt="Plates Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-xl font-bold">Plates</span>
          </Link>

          {/* Right side - User Menu */}
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
