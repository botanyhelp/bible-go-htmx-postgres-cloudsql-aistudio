import React, { useState } from 'react';
import { Terminal, Play, Copy, Check, Clock, Server, Globe } from 'lucide-react';

interface ApiEndpoint {
  id: string;
  name: string;
  method: string;
  url: string;
  description: string;
  sqlEquivalent: string;
  defaultParams: Record<string, string>;
}

const ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'query1',
    name: 'Query 1: Scripture by Verse Title',
    method: 'GET',
    url: '/api/v1/scriptures',
    description: "Fetch scripture text using exact verse title lookup (e.g., 'John 3:16')",
    sqlEquivalent: "SELECT scripture_text FROM scriptures WHERE verse_title = 'John 3:16';",
    defaultParams: { verse_title: 'John 3:16' }
  },
  {
    id: 'query2',
    name: 'Query 2: Scripture by Relational JOINs',
    method: 'GET',
    url: '/api/v1/scriptures/lookup',
    description: 'Fetch scripture text joining volumes, books, chapters, and verses tables',
    sqlEquivalent: `SELECT vol.volume_title, b.book_title, c.chapter_number, v.scripture_text 
FROM volumes vol 
JOIN books b ON b.volume_id = vol.id 
JOIN chapters c ON c.book_id = b.id 
JOIN verses v ON v.chapter_id = c.id 
WHERE b.book_title = 'John' AND c.chapter_number = 3 AND v.verse_number = 16;`,
    defaultParams: { book: 'John', chapter: '3', verse: '16' }
  },
  {
    id: 'volumes',
    name: 'Get All Volumes',
    method: 'GET',
    url: '/api/v1/volumes',
    description: 'List all scripture volumes (Old Testament, New Testament, Book of Mormon, etc.)',
    sqlEquivalent: 'SELECT id, volume_title, volume_long_title, volume_short_title FROM volumes ORDER BY id;',
    defaultParams: {}
  },
  {
    id: 'books',
    name: 'Get Books by Volume ID',
    method: 'GET',
    url: '/api/v1/books',
    description: 'List books belonging to a specific volume (e.g., volume_id=1 for Old Testament)',
    sqlEquivalent: 'SELECT id, volume_id, book_title FROM books WHERE volume_id = 1 ORDER BY id;',
    defaultParams: { volume_id: '1' }
  },
  {
    id: 'search',
    name: 'Full-Text Scripture Search',
    method: 'GET',
    url: '/api/v1/search',
    description: 'Search for text matches across all scripture verses',
    sqlEquivalent: "SELECT verse_title, scripture_text FROM scriptures WHERE scripture_text ILIKE '%love%' LIMIT 20;",
    defaultParams: { q: 'love' }
  }
];

const CLOUD_RUN_URL = "https://bible-go-htmx-postgres-cloudsql-aistudio-1083168693848.us-central1.run.app";

export const ApiTester: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(ENDPOINTS[0]);
  const [params, setParams] = useState<Record<string, string>>(ENDPOINTS[0].defaultParams);
  const [useCloudRun, setUseCloudRun] = useState(true);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep);
    setParams(ep.defaultParams);
    setResponse(null);
    setStatusCode(null);
    setLatency(null);
  };

  const handleParamChange = (key: string, val: string) => {
    setParams(prev => ({ ...prev, [key]: val }));
  };

  const getBaseHost = () => {
    return useCloudRun ? CLOUD_RUN_URL : '';
  };

  const constructFullUrl = () => {
    const query = new URLSearchParams(params).toString();
    const relativePath = query ? `${selectedEndpoint.url}?${query}` : selectedEndpoint.url;
    return useCloudRun ? `${CLOUD_RUN_URL}${relativePath}` : relativePath;
  };

  const generateCurl = () => {
    const fullUrl = constructFullUrl();
    return `curl -X ${selectedEndpoint.method} "${fullUrl}"`;
  };

  const executeApiCall = async () => {
    setLoading(true);
    setResponse(null);
    const start = performance.now();

    try {
      const targetUrl = constructFullUrl();
      const res = await fetch(targetUrl);
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);

      setStatusCode(res.status);
      setLatency(elapsed);
      setResponse(data);
    } catch (err: any) {
      setStatusCode(500);
      setResponse({ success: false, error: err.message || 'Failed to connect to API endpoint' });
    } finally {
      setLoading(false);
    }
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Interactive Golang REST API Console
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Test live REST API queries against your deployed Google Cloud Run Go server.
          </p>
        </div>

        {/* Target Backend Selector */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
          <button
            onClick={() => setUseCloudRun(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              useCloudRun
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Live Cloud Run</span>
          </button>
          <button
            onClick={() => setUseCloudRun(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              !useCloudRun
                ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Local Engine</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoint Selector Sidebar */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1">
            Available Endpoints
          </div>
          {ENDPOINTS.map((ep) => {
            const isSelected = selectedEndpoint.id === ep.id;
            return (
              <button
                key={ep.id}
                onClick={() => handleSelectEndpoint(ep)}
                className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{ep.name}</span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono text-[10px] rounded">
                    {ep.method}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 truncate">
                  {ep.url}
                </div>
              </button>
            );
          })}
        </div>

        {/* Console Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {/* Query Parameters & Trigger Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {selectedEndpoint.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedEndpoint.description}
              </p>
            </div>

            {/* URL Input Bar */}
            <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto">
              <span className="text-emerald-500 font-bold px-2 py-0.5 bg-slate-800 rounded">
                {selectedEndpoint.method}
              </span>
              <span className="text-slate-200 flex-1">{constructFullUrl()}</span>
            </div>

            {/* Query Parameters Form */}
            {Object.keys(params).length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Query Parameters:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(params).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-[11px] font-mono text-slate-500 mb-1">
                        {key}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SQL Equivalent Query Box */}
            <div className="p-3 bg-slate-950 text-slate-300 rounded-xl font-mono text-xs">
              <div className="text-slate-500 text-[10px] uppercase mb-1">// PostgreSQL Executed Statement:</div>
              <code className="text-emerald-400">{selectedEndpoint.sqlEquivalent}</code>
            </div>

            {/* Execute Button */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={copyCurl}
                className="px-3.5 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition-colors flex items-center gap-1.5"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCurl ? 'cURL Copied' : 'Copy cURL'}</span>
              </button>

              <button
                onClick={executeApiCall}
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{loading ? 'Executing...' : 'Execute Request'}</span>
              </button>
            </div>
          </div>

          {/* HTTP Response Panel */}
          {response && (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    statusCode === 200 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                  }`}>
                    {statusCode} OK
                  </span>
                  {latency !== null && (
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {latency}ms
                    </span>
                  )}
                  {useCloudRun && (
                    <span className="text-emerald-400 text-[10px] font-sans">
                      Target: Cloud Run Live DB
                    </span>
                  )}
                </div>
                <span className="text-slate-500">application/json</span>
              </div>

              <div className="p-5 max-h-96 overflow-y-auto">
                <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
