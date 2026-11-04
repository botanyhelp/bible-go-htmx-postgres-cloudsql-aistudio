import React, { useState } from 'react';
import { Header } from './components/Header';
import { ScriptureCascadingExplorer } from './components/ScriptureCascadingExplorer';
import { GoCodeViewer } from './components/GoCodeViewer';
import { ApiTester } from './components/ApiTester';
import { CloudSqlGuide } from './components/CloudSqlGuide';
import { SchemaViewer } from './components/SchemaViewer';
import { BookOpen, Code2, Terminal, Database, Cpu } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('explorer');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* 3-Zone Top Bar */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs (Mobile / Quick Switcher) */}
        <div className="md:hidden flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-800 rounded-xl mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex-1 min-w-[100px] px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'explorer'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Explorer
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 min-w-[100px] px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'code'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Go Code
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`flex-1 min-w-[100px] px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'api'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            REST API
          </button>
          <button
            onClick={() => setActiveTab('cloudsql')}
            className={`flex-1 min-w-[100px] px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'cloudsql'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Cloud SQL
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`flex-1 min-w-[100px] px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'schema'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Schema
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'explorer' && <ScriptureCascadingExplorer />}
        {activeTab === 'code' && <GoCodeViewer />}
        {activeTab === 'api' && <ApiTester />}
        {activeTab === 'cloudsql' && <CloudSqlGuide />}
        {activeTab === 'schema' && <SchemaViewer />}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Golang <code className="font-mono text-emerald-600 dark:text-emerald-400">net/http</code> + Google Cloud SQL PostgreSQL scriptures database engine.
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('code')} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              main.go
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setActiveTab('cloudsql')} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              .env Guide
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setActiveTab('schema')} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              PostgreSQL DDL
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
