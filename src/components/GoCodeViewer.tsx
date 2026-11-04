import React, { useState } from 'react';
import { GOLANG_CODEBASE, GoFile } from '../data/golangCodebase';
import { Code2, Copy, Check, FileCode, Download, ExternalLink, Terminal, ShieldCheck } from 'lucide-react';

export const GoCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<GoFile>(GOLANG_CODEBASE[0]);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFiles = GOLANG_CODEBASE.filter(f => 
    f.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (file: GoFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-semibold rounded">
              Go 1.22 + net/http
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-500 font-mono">pgx/v5 PostgreSQL Driver</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Production Golang Server & Suite
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Clean, modular, complete Go source code ready for Google Cloud Run / Cloud SQL deployment.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => downloadFile(selectedFile)}
            className="px-4 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download {selectedFile.filename}</span>
          </button>

          <button
            onClick={copyCode}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Main Code Viewer Layout (Sidebar + Main Code Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Sidebar File Tree */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col">
          <div className="mb-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Go files..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 mb-2 uppercase tracking-wider">
            Project Files ({filteredFiles.length})
          </div>

          <div className="space-y-1 flex-1 overflow-y-auto max-h-[500px] pr-1">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <FileCode className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono truncate">{file.path}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {file.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Zero third-party NoSQL framework. Clean SQL & net/http.</span>
          </div>
        </div>

        {/* Code View Container */}
        <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          {/* File Tab Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-slate-900/90 border-b border-slate-800 text-slate-300">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-xs font-semibold text-emerald-300">{selectedFile.path}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 uppercase">
              {selectedFile.language}
            </span>
          </div>

          {/* Description banner */}
          <div className="px-5 py-2.5 bg-slate-900/50 border-b border-slate-800/80 text-xs text-slate-400">
            {selectedFile.description}
          </div>

          {/* Code Text Content */}
          <div className="p-5 flex-1 overflow-x-auto max-h-[600px]">
            <pre className="font-mono text-xs text-slate-200 leading-relaxed whitespace-pre">
              {selectedFile.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
