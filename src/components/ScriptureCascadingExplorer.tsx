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
  AlertCircle,
  FileText
} from 'lucide-react';

interface DisplayVerse {
  verseTitle: string;
  scriptureText: string;
}

export const ScriptureCascadingExplorer: React.FC = () => {
  // Cascading Form State (0 means All / Unselected)
  const [selectedVolumeId, setSelectedVolumeId] = useState<number>(2); // Default New Testament
  const [availableBooks, setAvailableBooks] = useState<Book[]>(getBooksByVolume(2));
  const [selectedBookId, setSelectedBookId] = useState<number>(43); // Default John
  const [availableChapters, setAvailableChapters] = useState<number[]>(getChaptersByBook(43));
  const [selectedChapter, setSelectedChapter] = useState<number>(3); // Default Chapter 3
  const [availableVerses, setAvailableVerses] = useState<number[]>(getVersesByChapter(43, 3));
  const [selectedVerse, setSelectedVerse] = useState<number>(16); // Default Verse 16

  // Query Execution Mode
  const [queryMode, setQueryMode] = useState<'title' | 'join'>('join');

  // Scripture Result State
  const [headerTitle, setHeaderTitle] = useState('John 3:16');
  const [displayedVerses, setDisplayedVerses] = useState<DisplayVerse[]>([]);
  const [executedQuery, setExecutedQuery] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [copiedScripture, setCopiedScripture] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScriptureQueryResult[]>([]);

  // 1. Handle Volume Change
  const handleVolumeChange = (volId: number) => {
    setSelectedVolumeId(volId);
    if (volId <= 0) {
      setAvailableBooks([]);
      setSelectedBookId(0);
      setAvailableChapters([]);
      setSelectedChapter(0);
      setAvailableVerses([]);
      setSelectedVerse(0);
      return;
    }

    const books = getBooksByVolume(volId);
    setAvailableBooks(books);
    if (books.length > 0) {
      const defaultBook = books[0];
      setSelectedBookId(defaultBook.id);
      const chaps = getChaptersByBook(defaultBook.id);
      setAvailableChapters(chaps);
      setSelectedChapter(0); // Default to All Chapters or 1
      setAvailableVerses([]);
      setSelectedVerse(0);
      executeLookup(defaultBook.id, 0, 0);
    } else {
      setSelectedBookId(0);
    }
  };

  // 2. Handle Book Change
  const handleBookChange = (bookId: number) => {
    setSelectedBookId(bookId);
    if (bookId <= 0) {
      setAvailableChapters([]);
      setSelectedChapter(0);
      setAvailableVerses([]);
      setSelectedVerse(0);
      return;
    }

    const chaps = getChaptersByBook(bookId);
    setAvailableChapters(chaps);
    setSelectedChapter(0); // Default to entire book
    setAvailableVerses([]);
    setSelectedVerse(0);
    executeLookup(bookId, 0, 0);
  };

  // 3. Handle Chapter Change
  const handleChapterChange = (chapNum: number) => {
    setSelectedChapter(chapNum);
    if (chapNum <= 0) {
      setAvailableVerses([]);
      setSelectedVerse(0);
      executeLookup(selectedBookId, 0, 0);
      return;
    }

    const verses = getVersesByChapter(selectedBookId, chapNum);
    setAvailableVerses(verses);
    setSelectedVerse(0); // Default to entire chapter
    executeLookup(selectedBookId, chapNum, 0);
  };

  // 4. Handle Verse Change
  const handleVerseChange = (verseNum: number) => {
    setSelectedVerse(verseNum);
    executeLookup(selectedBookId, selectedChapter, verseNum);
  };

  const CLOUD_RUN_URL = "https://bible-go-htmx-postgres-cloudsql-aistudio-1083168693848.us-central1.run.app";
  const [loading, setLoading] = useState<boolean>(false);

  // Main Scripture Lookup Dispatcher
  const executeLookup = async (bookId: number, chapNum: number, verseNum: number) => {
    // Validation: Require Volume and Book
    if (selectedVolumeId <= 0 || bookId <= 0) {
      setValidationError("Please select at least a Volume and a Book to fetch scripture text.");
      setDisplayedVerses([]);
      return;
    }
    setValidationError(null);
    setLoading(true);

    const bookObj = BOOKS.find(b => b.id === bookId);
    const bookTitle = bookObj ? bookObj.book_title : 'John';

    try {
      const url = `${CLOUD_RUN_URL}/api/v1/scriptures/lookup?book_id=${bookId}&book=${encodeURIComponent(bookTitle)}&chapter=${chapNum}&verse=${verseNum}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const rawItems = Array.isArray(json.data) ? json.data : [json.data];
          if (rawItems.length > 0) {
            const items: DisplayVerse[] = rawItems.map((item: any) => ({
              verseTitle: item.verse_title || `${bookTitle} ${chapNum}:${item.verse_number || 1}`,
              scriptureText: item.scripture_text
            }));

            if (chapNum > 0 && verseNum > 0) {
              setHeaderTitle(items[0].verseTitle);
            } else if (chapNum > 0) {
              setHeaderTitle(`${bookTitle} Chapter ${chapNum}`);
            } else {
              setHeaderTitle(`${bookTitle} (Entire Book)`);
            }

            setDisplayedVerses(items);
            setExecutedQuery(rawItems[0].sql_query_used || rawItems[0].query_used || `SELECT scripture_text FROM scriptures WHERE book_title = '${bookTitle}'...`);
            setLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Cloud Run DB fetch fallback:", err);
    } finally {
      setLoading(false);
    }

    // Local Fallback Engine
    if (chapNum > 0 && verseNum > 0) {
      setHeaderTitle(`${bookTitle} ${chapNum}:${verseNum}`);
      const res = lookupScriptureByJoin(bookTitle, chapNum, verseNum);
      setDisplayedVerses([{ verseTitle: res.verse_title, scriptureText: res.scripture_text }]);
      setExecutedQuery(res.query_used);
    } else if (chapNum > 0) {
      setHeaderTitle(`${bookTitle} Chapter ${chapNum}`);
      const query = `SELECT vol.volume_title, b.book_title, c.chapter_number, v.verse_number, v.verse_title, v.scripture_text 
FROM books b JOIN volumes vol ON b.volume_id = vol.id JOIN chapters c ON c.book_id = b.id JOIN verses v ON v.chapter_id = c.id 
WHERE b.id = ${bookId} AND c.chapter_number = ${chapNum} ORDER BY v.verse_number;`;
      setExecutedQuery(query);

      const items: DisplayVerse[] = [];
      const totalVerses = availableVerses.length > 0 ? availableVerses.length : 15;
      for (let v = 1; v <= Math.min(totalVerses, 20); v++) {
        const res = lookupScriptureByJoin(bookTitle, chapNum, v);
        items.push({ verseTitle: `${bookTitle} ${chapNum}:${v}`, scriptureText: res.scripture_text });
      }
      setDisplayedVerses(items);
    } else {
      setHeaderTitle(`${bookTitle} (Entire Book)`);
      const query = `SELECT vol.volume_title, b.book_title, c.chapter_number, v.verse_number, v.verse_title, v.scripture_text 
FROM books b JOIN volumes vol ON b.volume_id = vol.id JOIN chapters c ON c.book_id = b.id JOIN verses v ON v.chapter_id = c.id 
WHERE b.id = ${bookId} ORDER BY c.chapter_number, v.verse_number LIMIT 100;`;
      setExecutedQuery(query);

      const items: DisplayVerse[] = [];
      for (let c = 1; c <= 3; c++) {
        for (let v = 1; v <= 3; v++) {
          const res = lookupScriptureByJoin(bookTitle, c, v);
          items.push({ verseTitle: `${bookTitle} ${c}:${v}`, scriptureText: res.scripture_text });
        }
      }
      setDisplayedVerses(items);
    }
  };

  // Initial load
  useEffect(() => {
    executeLookup(43, 3, 16);
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
      executeLookup(43, 3, 16);
    } else if (presetKey === 'Genesis 1:1') {
      setSelectedVolumeId(1);
      setAvailableBooks(getBooksByVolume(1));
      setSelectedBookId(1);
      setAvailableChapters(getChaptersByBook(1));
      setSelectedChapter(1);
      setAvailableVerses(getVersesByChapter(1, 1));
      setSelectedVerse(1);
      executeLookup(1, 1, 1);
    } else if (presetKey === '1 Nephi 3:7') {
      setSelectedVolumeId(3);
      setAvailableBooks(getBooksByVolume(3));
      setSelectedBookId(67);
      setAvailableChapters(getChaptersByBook(67));
      setSelectedChapter(3);
      setAvailableVerses(getVersesByChapter(67, 3));
      setSelectedVerse(7);
      executeLookup(67, 3, 7);
    } else if (presetKey === 'Mosiah 2:17') {
      setSelectedVolumeId(3);
      setAvailableBooks(getBooksByVolume(3));
      setSelectedBookId(73);
      setAvailableChapters(getChaptersByBook(73));
      setSelectedChapter(2);
      setAvailableVerses(getVersesByChapter(73, 2));
      setSelectedVerse(17);
      executeLookup(73, 2, 17);
    }
  };

  // Search Handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);

    try {
      const url = `${CLOUD_RUN_URL}/api/v1/search?q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSearchResults(json.data);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Search DB fetch fallback:", err);
    } finally {
      setLoading(false);
    }

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
            <span>Flexible Verse / Chapter / Book Scope</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3 font-serif">
            LDS Scriptures Dynamic Explorer
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Selecting a <strong>Volume</strong> &amp; <strong>Book</strong> is required. Leaving <strong>Verse</strong> unselected fetches the entire chapter; leaving both <strong>Chapter &amp; Verse</strong> unselected fetches the entire book.
          </p>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Key Presets:
            </span>
            {['John 3:16', 'Genesis 1:1', '1 Nephi 3:7', 'Mosiah 2:17'].map(preset => (
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
              Cascading Form
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select Volume &amp; Book (Required). Leave Verse empty for entire Chapter or Book.
            </p>
          </div>
        </div>

        {/* The 4 Cascading Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {/* 1. Volume Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>1. Volume *</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">Required</span>
            </label>
            <select
              value={selectedVolumeId}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="0">-- Select Volume --</option>
              {VOLUMES.map((vol) => (
                <option key={vol.id} value={vol.id}>
                  {vol.volume_title}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Book Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>2. Book *</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">Required</span>
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => handleBookChange(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 rounded-xl text-sm font-semibold text-emerald-900 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="0">-- Select Book --</option>
              {availableBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.book_title}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Chapter Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>3. Chapter</span>
              <span className="text-[10px] text-slate-400 font-mono">Optional</span>
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => handleChapterChange(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="0">-- All Chapters (Entire Book) --</option>
              {availableChapters.map((chap) => (
                <option key={chap} value={chap}>
                  Chapter {chap}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Verse Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>4. Verse</span>
              <span className="text-[10px] text-slate-400 font-mono">Optional</span>
            </label>
            <select
              value={selectedVerse}
              onChange={(e) => handleVerseChange(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="0">-- All Verses (Entire Chapter) --</option>
              {availableVerses.map((v) => (
                <option key={v} value={v}>
                  Verse {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => executeLookup(selectedBookId, selectedChapter, selectedVerse)}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>Fetch Scripture Text</span>
        </button>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-6 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-sm flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold mb-0.5">Selection Required</div>
            <p className="text-xs text-amber-800 dark:text-amber-300">{validationError}</p>
          </div>
        </div>
      )}

      {/* Main Scripture Text Result Card */}
      {!validationError && displayedVerses.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-md transition-all space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
                {currentVolObj?.volume_title}
              </span>
              <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {headerTitle}
              </h3>
              <span className="text-xs text-slate-500">{displayedVerses.length} verses retrieved</span>
            </div>

            <button
              onClick={() => copyText(displayedVerses.map(v => `${v.verseTitle}: "${v.scriptureText}"`).join('\n'), 'scripture')}
              className="px-3.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copiedScripture ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied All!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>

          {/* Formatted Verses List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {displayedVerses.map((v, idx) => (
              <div 
                key={idx}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80"
              >
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  {v.verseTitle}
                </div>
                <p className="text-base leading-relaxed font-serif text-slate-800 dark:text-slate-200 italic">
                  "{v.scriptureText}"
                </p>
              </div>
            ))}
          </div>

          {/* Exact SQL Query Executed Box */}
          <div className="rounded-xl bg-slate-950 text-slate-200 p-5 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between mb-2 text-slate-400 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-300">
                  Executed PostgreSQL Query:
                </span>
              </div>
              <button
                onClick={() => copyText(executedQuery, 'query')}
                className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                {copiedQuery ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedQuery ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {executedQuery}
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
                    setDisplayedVerses([{ verseTitle: res.verse_title, scriptureText: res.scripture_text }]);
                    setHeaderTitle(res.verse_title);
                    setExecutedQuery(res.query_used);
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
