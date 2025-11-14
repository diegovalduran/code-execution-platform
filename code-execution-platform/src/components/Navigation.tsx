'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(path);
  };

  return (
    <nav className="border-b border-[#3a3a3a] bg-[#262626]">
      <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex flex-shrink-0 items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#9333ea]">
                <span className="text-lg font-bold text-white">C</span>
              </div>
              <span className="ml-2 text-lg font-semibold text-white">CodeExec</span>
            </Link>
            <div className="ml-8 hidden sm:flex sm:space-x-1">
              <Link
                href="/"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/') && pathname !== '/submissions' && pathname !== '/admin'
                    ? 'text-[#9333ea]'
                    : 'text-[#b3b3b3] hover:text-white'
                }`}
              >
                Problems
              </Link>
              <Link
                href="/submissions"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/submissions')
                    ? 'text-[#9333ea]'
                    : 'text-[#b3b3b3] hover:text-white'
                }`}
              >
                My Submissions
              </Link>
              <Link
                href="/admin"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/admin')
                    ? 'text-[#9333ea]'
                    : 'text-[#b3b3b3] hover:text-white'
                }`}
              >
                Admin
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Link
              href="/problems/new"
              className="inline-flex items-center rounded-md bg-[#9333ea] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#7c3aed]"
            >
              Create Problem
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

