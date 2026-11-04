import React from 'react';
import { Terminal, Database, Code2, BookOpen, Cpu } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <a 
        href="#" 
        onClick={(e) => { e.preventDefault(); setActiveTab('explorer'); }}
        className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-mono font-bold text-sm shadow-sm">
          Go
        </div>
        <span>Scriptures API & Engine</span>
      </a>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
        <button
          onClick={() => setActiveTab('explorer')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'explorer'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
              : 'hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Interactive Explorer</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'code'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
              : 'hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Go Codebase</span>
        </button>

        <button
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'api'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
              : 'hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>REST API Tester</span>
        </button>

        <button
          onClick={() => setActiveTab('cloudsql')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'cloudsql'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
              : 'hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cloud SQL Guide</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'schema'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
              : 'hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>PostgreSQL Schema</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab('code')}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-sm flex items-center gap-1.5"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>View main.go</span>
        </button>
      </div>
    </header>
  );
};
