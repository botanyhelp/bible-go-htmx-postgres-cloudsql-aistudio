import React, { useState, useEffect } from 'react';
import { 
  VOLUMES, 
  BOOKS, 
  getBooksByVolume, 
  getChaptersByBook, 
  getVersesByChapter, 
  lookupScriptureByTitle, 
  lookupScriptureByJoin,
  searchScriptures,
  Book,
  ScriptureQueryResult 
} from '../data/scripturesData';
import { 
  BookOpen, 
  Check, 
  Copy, 
  Database, 
  Search, 
  Terminal, 
  Filter, 
  Sparkles, 
  ChevronRight,
  Code
} from 'lucide-react';

export const ScriptureCascadingExplorer: React.FC = () => {
  // Cascading Form State
  const [selectedVolumeId, setSelectedVolumeId] = useState<number>(2); // Default New Testament
  const [availableBooks, setAvailableBooks] = useState<Book[]>(getBooksByVolume(2));
  const [selectedBookId, setSelectedBookId] = useState<number>(43); // Default John
  const [availableChapters, setAvailableChapters] = useState<number[]>(getChaptersByBook(43));
  const [selectedChapter, setSelectedChapter] = useState<number>(3);
  const [availableVerses, setAvailableVerses] = useState<number[]>(getVersesByChapter(43, 3));
  const [selectedVerse, setSelectedVerse] = useState<number>(16);

  // Query Execution Mode
  const [queryMode, setQueryMode] = useState<'title' | 'join'>('join');

  // Scripture Result State
  const [currentResult, setCurrentResult] = useState<ScriptureQueryResult | null>(null);
  const [copiedScripture, setCopiedScripture] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScriptureQueryResult[]>([]);

  // 1. Handle Volume Change (Dynamic Cascading JavaScript Logic)
  const handleVolumeChange = (volId: number) => {
    setSelectedVolumeId(volId);
    const books = getBooksByVolume(volId);
    setAvailableBooks(books);

    if (books.length > 0) {
      const defaultBook = books[0];
      setSelectedBookId(defaultBook.id);
      const chaps = getChaptersByBook(defaultBook.id);
      setAvailableChapters(chaps);
      setSelectedChapter(1);
      const verses = getVersesByChapter(defaultBook.id, 1);
      setAvailableVerses(verses);
      setSelectedVerse(1);

      // Auto fetch
      executeLookup(defaultBook.book_title, 1, 1, queryMode);
    }
  };

  // 2. Handle Book Change
  const handleBookChange = (bookId: number) => {
    setSelectedBookId(bookId);
    const chaps = getChaptersByBook(bookId);
    setAvailableChapters(chaps);
    setSelectedChapter(1);
    const verses = getVersesByChapter(bookId, 1);
    setAvailableVerses(verses);
    setSelectedVerse(1);

    const bookObj = BOOKS.find(b => b.id === bookId);
    if (bookObj) {
      executeLookup(bookObj.book_title, 1, 1, queryMode);
    }
  };

  // 3. Handle Chapter Change
  const handleChapterChange = (chapNum: number) => {
    setSelectedChapter(chapNum);
    const verses = getVersesByChapter(selectedBookId, chapNum);
    setAvailableVerses(verses);
    setSelectedVerse(1);

    const bookObj = BOOKS.find(b => b.id === selectedBookId);
    if (bookObj) {
      executeLookup(bookObj.book_title, chapNum, 1, queryMode);
    }
  };

  // 4. Handle Verse Change
  const handleVerseChange = (verseNum: number) => {
    setSelectedVerse(verseNum);
    const bookObj = BOOKS.find(b => b.id === selectedBookId);
    if (bookObj) {
      executeLookup(bookObj.book_title, selectedChapter, verseNum, queryMode);
    }
  };

  // Execute Scripture Lookup based on current selections
  const executeLookup = (bookTitle: string, chap: number, verse: number, mode: 'title' | 'join') => {
    if (mode === 'title') {
      const verseTitle = `${bookTitle} ${chap}:${verse}`;
      const res = lookupScriptureByTitle(verseTitle) || lookupScriptureByJoin(bookTitle, chap, verse);
      setCurrentResult(res);
    } else {
      const res = lookupScriptureByJoin(bookTitle, chap, verse);
      setCurrentResult(res);
    }
  };

  // Initial load: John 3:16
  useEffect(() => {
    executeLookup('John', 3, 16, queryMode);
  }, []);

  // Preset Shortcuts
  const applyPreset = (presetKey: string) => {
    if (presetKey === 'John 3:16') {
      setSelectedVolumeId(2);
      setAvailableBooks(getBooksByVolume(2));
      setSelectedBookId(43);
      setAvailableChapters(getChaptersByBook(43));
      setSelectedChapter(3);
      setAvailableVerses(getVersesByChapter(43, 3));
      setSelectedVerse(16);
      executeLookup('John', 3, 16, queryMode);
    } else if (presetKey === 'Genesis 1:1') {
      setSelectedVolumeId(1);
      setAvailableBooks(getBooksByVolume(1));
      setSelectedBookId(1);
      setAvailableChapters(getChaptersByBook(1));
      setSelectedChapter(1);
      setAvailableVerses(getVersesByChapter(1, 1));
      setSelectedVerse(1);
      executeLookup('Genesis', 1, 1, queryMode);
    } else if (presetKey === '1 Nephi 3:7') {
      setSelectedVolumeId(3);
      setAvailableBooks(getBooksByVolume(3));
      setSelectedBookId(67);
      setAvailableChapters(getChaptersByBook(67));
      setSelectedChapter(3);
      setAvailableVerses(getVersesByChapter(67, 3));
      setSelectedVerse(7);
      executeLookup('1 Nephi', 3, 7, queryMode);
    } else if (presetKey === 'Mosiah 2:17') {
      setSelectedVolumeId(3);
      setAvailableBooks(getBooksByVolume(3));
      setSelectedBookId(73);
      setAvailableChapters(getChaptersByBook(73));
      setSelectedChapter(2);
      setAvailableVerses(getVersesByChapter(73, 2));
      setSelectedVerse(17);
      executeLookup('Mosiah', 2, 17, queryMode);
    } else if (presetKey === 'D&C 4:2') {
      setSelectedVolumeId(4);
      setAvailableBooks(getBooksByVolume(4));
      setSelectedBookId(80);
      setAvailableChapters(getChaptersByBook(80));
      setSelectedChapter(4);
      setAvailableVerses(getVersesByChapter(80, 4));
      setSelectedVerse(2);
      executeLookup('Doctrine and Covenants', 4, 2, queryMode);
    } else if (presetKey === 'Moses 1:39') {
      setSelectedVolumeId(5);
      setAvailableBooks(getBooksByVolume(5));
      setSelectedBookId(81);
      setAvailableChapters(getChaptersByBook(81));
      setSelectedChapter(1);
      setAvailableVerses(getVersesByChapter(81, 1));
      setSelectedVerse(39);
      executeLookup('Moses', 1, 39, queryMode);
    }
  };

  // Search Handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const results = searchScriptures(searchQuery);
    setSearchResults(results);
  };

  const copyText = (text: string, type: 'scripture' | 'query') => {
    navigator.clipboard.writeText(text);
    if (type === 'scripture') {
      setCopiedScripture(true);
      setTimeout(() => setCopiedScripture(false), 2000);
    } else {
      setCopiedQuery(true);
      setTimeout(() => setCopiedQuery(false), 2000);
    }
  };

  const currentBookObj = BOOKS.find(b => b.id === selectedBookId);
  const currentVolObj = VOLUMES.find(v => v.id === selectedVolumeId);

  return (
    <div className="space-y-8">
      {/* Hero Header Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg border border-slate-800">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-3 uppercase tracking-wider">
            <span>PostgreSQL Cloud SQL</span>
            <span>·</span>
            <span>Go net/http</span>
            <span>·</span>
            <span>HTMX & Dynamic JS</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3 font-serif">
            LDS Scriptures Dynamic Explorer
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Interactive demonstration of dynamic cascading form select boxes (Volume → Book → Chapter → Verse).
            When a Volume is selected (e.g. <span className="text-emerald-300 font-semibold">Old Testament</span>), 
            JavaScript filters the Book options to present <span className="text-emerald-300 font-semibold">Genesis</span>, 
            while excluding New Testament books like <span className="text-rose-300 font-semibold">Luke</span>.
          </p>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Key Presets:
            </span>
            {['John 3:16', 'Genesis 1:1', '1 Nephi 3:7', 'Mosiah 2:17', 'D&C 4:2', 'Moses 1:39'].map(preset => (
              <button
                key={preset}
                onClick={() => applyPreset(preset)}
                className="px-3 py-1 text-xs font-medium bg-slate-800/80 hover:bg-emerald-600/30 hover:text-emerald-300 border border-slate-700 rounded-md transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Cascading Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Dynamic Cascading Select Form
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Selection in parent dropdown dynamically repopulates child options via JavaScript/HTMX
            </p>
          </div>

          {/* Query Strategy Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => {
                setQueryMode('join');
                if (currentBookObj) executeLookup(currentBookObj.book_title, selectedChapter, selectedVerse, 'join');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                queryMode === 'join'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Relational JOIN Query
            </button>
            <button
              onClick={() => {
                setQueryMode('title');
                if (currentBookObj) executeLookup(currentBookObj.book_title, selectedChapter, selectedVerse, 'title');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                queryMode === 'title'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Verse Title Query
            </button>
          </div>
        </div>

        {/* The 4 Cascading Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {/* 1. Volume Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>1. Volume</span>
              <span className="text-[10px] text-slate-400 font-mono">vol.id</span>
            </label>
            <select
              value={selectedVolumeId}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              {VOLUMES.map((vol) => (
                <option key={vol.id} value={vol.id}>
                  {vol.volume_title}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Filter: {currentVolObj?.volume_short_title}
            </span>
          </div>

          {/* 2. Book Select (Filtered dynamically based on selectedVolumeId) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>2. Book</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Filtered JS</span>
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => handleBookChange(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 rounded-xl text-sm font-semibold text-emerald-900 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              {availableBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.book_title}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
              {availableBooks.length} books in {currentVolObj?.volume_title}
            </span>
          </div>

          {/* 3. Chapter Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>3. Chapter</span>
              <span className="text-[10px] text-slate-400 font-mono">c.number</span>
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => handleChapterChange(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              {availableChapters.map((chap) => (
                <option key={chap} value={chap}>
                  Chapter {chap}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Max Chapters: {availableChapters.length}
            </span>
          </div>

          {/* 4. Verse Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>4. Verse</span>
              <span className="text-[10px] text-slate-400 font-mono">v.number</span>
            </label>
            <select
              value={selectedVerse}
              onChange={(e) => handleVerseChange(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              {availableVerses.map((v) => (
                <option key={v} value={v}>
                  Verse {v}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Verse {selectedVerse} selected
            </span>
          </div>
        </div>

        {/* Dynamic Filter Verification Tag */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/70 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">Cascading Filter State:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{currentVolObj?.volume_title}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{currentBookObj?.book_title}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span>Chapter {selectedChapter}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span>Verse {selectedVerse}</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            {selectedVolumeId === 1 && <span className="text-amber-600 dark:text-amber-400">✓ Contains Genesis · Excludes Luke</span>}
            {selectedVolumeId === 2 && <span className="text-blue-600 dark:text-blue-400">✓ Contains Luke & John · Excludes Genesis</span>}
            {selectedVolumeId === 3 && <span className="text-emerald-600 dark:text-emerald-400">✓ Contains 1 Nephi & Mosiah · Excludes John</span>}
            {selectedVolumeId === 4 && <span className="text-purple-600 dark:text-purple-400">✓ Contains D&C Sections</span>}
            {selectedVolumeId === 5 && <span className="text-teal-600 dark:text-teal-400">✓ Contains Moses & Abraham</span>}
          </div>
        </div>
      </div>

      {/* Main Scripture Text Result Card */}
      {currentResult && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-md transition-all">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
                {currentResult.volume_title}
              </span>
              <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {currentResult.verse_title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyText(currentResult.scripture_text, 'scripture')}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {copiedScripture ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Formatted Scripture Text Display */}
          <blockquote className="text-xl sm:text-2xl font-serif leading-relaxed text-slate-800 dark:text-slate-100 italic mb-8 pl-4 border-l-2 border-emerald-500 dark:border-emerald-400">
            "{currentResult.scripture_text}"
          </blockquote>

          {/* Exact SQL Query Executed Box */}
          <div className="rounded-xl bg-slate-950 text-slate-200 p-5 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between mb-2 text-slate-400 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-300">
                  {queryMode === 'title' ? 'Query 1: verse_title Filter' : 'Query 2: Relational Table JOINs'}
                </span>
              </div>
              <button
                onClick={() => copyText(currentResult.query_used, 'query')}
                className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                {copiedQuery ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedQuery ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {currentResult.query_used}
            </pre>
          </div>
        </div>
      )}

      {/* Full-text Scripture Search Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Full-Text Scripture Search
        </h3>
        
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search scriptures e.g. "love", "light", "faith", "repentance"'
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
          >
            Search
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-3 mt-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Found {searchResults.length} matching verses:
            </p>
            <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-1">
              {searchResults.map((res, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setCurrentResult(res);
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700/70 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {res.verse_title}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {res.volume_title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic font-serif">
                    "{res.scripture_text}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
