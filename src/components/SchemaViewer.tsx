import React, { useState } from 'react';
import { Database, Table, Key, ArrowRight, Code, Copy, Check } from 'lucide-react';

export const SchemaViewer: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);

  const rawSqlSchema = `-- PostgreSQL Schema for LDS Scriptures Database
-- Source: https://raw.githubusercontent.com/beandog/lds-scriptures/refs/heads/master/postgresql/schema.txt

CREATE TABLE volumes (
    id SERIAL PRIMARY KEY,
    volume_title VARCHAR(255) NOT NULL,
    volume_long_title VARCHAR(255) NOT NULL,
    volume_subtitle VARCHAR(255),
    volume_short_title VARCHAR(50) NOT NULL,
    lds_gospel_art_book_id INT
);

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    volume_id INT NOT NULL REFERENCES volumes(id) ON DELETE CASCADE,
    book_title VARCHAR(255) NOT NULL,
    book_long_title VARCHAR(255) NOT NULL,
    book_subtitle VARCHAR(255),
    book_short_title VARCHAR(50) NOT NULL,
    lds_gospel_art_book_id INT
);

CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    book_id INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    chapter_number INT NOT NULL
);

CREATE TABLE verses (
    id SERIAL PRIMARY KEY,
    chapter_id INT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    verse_number INT NOT NULL,
    scripture_text TEXT NOT NULL,
    verse_title VARCHAR(255) NOT NULL,
    verse_short_title VARCHAR(255) NOT NULL
);

CREATE OR REPLACE VIEW scriptures AS
SELECT 
    v.id,
    vol.volume_title,
    b.book_title,
    c.chapter_number,
    v.verse_number,
    v.verse_title,
    v.scripture_text
FROM verses v
JOIN chapters c ON v.chapter_id = c.id
JOIN books b ON c.book_id = b.id
JOIN volumes vol ON b.volume_id = vol.id;

CREATE INDEX idx_books_volume_id ON books(volume_id);
CREATE INDEX idx_chapters_book_id ON chapters(book_id);
CREATE INDEX idx_verses_chapter_id ON verses(chapter_id);
CREATE INDEX idx_verses_verse_title ON verses(verse_title);`;

  const copySql = () => {
    navigator.clipboard.writeText(rawSqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="p-8 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-2 uppercase">
          <span>Relational Database Architecture</span>
        </div>
        <h2 className="text-2xl font-bold font-serif mb-2">
          PostgreSQL LDS Scriptures Schema
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          Visual entity-relationship breakdown of the 4 core tables (<span className="text-emerald-400 font-mono">volumes</span>, <span className="text-emerald-400 font-mono">books</span>, <span className="text-emerald-400 font-mono">chapters</span>, <span className="text-emerald-400 font-mono">verses</span>) and the <span className="text-emerald-400 font-mono">scriptures</span> denormalized query view.
        </p>
      </div>

      {/* Visual ER Diagram Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Table 1: volumes */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">volumes</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Root Entity</span>
          </div>

          <ul className="text-xs font-mono space-y-2 text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
              <Key className="w-3.5 h-3.5 shrink-0" /> id (PK, INT)
            </li>
            <li className="pl-5 text-slate-600 dark:text-slate-400">volume_title (VARCHAR)</li>
            <li className="pl-5 text-slate-600 dark:text-slate-400">volume_long_title (VARCHAR)</li>
            <li className="pl-5 text-slate-600 dark:text-slate-400">volume_subtitle (VARCHAR)</li>
            <li className="pl-5 text-slate-600 dark:text-slate-400">volume_short_title (VARCHAR)</li>
          </ul>
        </div>

        {/* Table 2: books */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">books</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-500">1:N with volumes</span>
          </div>

          <ul className="text-xs font-mono space-y-2 text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
              <Key className="w-3.5 h-3.5 shrink-0" /> id (PK, INT)
            </li>
            <li className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <ArrowRight className="w-3.5 h-3.5 shrink-0" /> volume_id (FK → volumes.id)
            </li>
            <li className="pl-5 text-slate-600 dark:text-slate-400">book_title (VARCHAR)</li>
            <li className="pl-5 text-slate-600 dark:text-slate-400">book_long_title (VARCHAR)</li>
            <li className="pl-5 text-slate-600 dark:text-slate-400">book_short_title (VARCHAR)</li>
          </ul>
        </div>

        {/* Table 3: chapters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">chapters</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-500">1:N with books</span>
          </div>

          <ul className="text-xs font-mono space-y-2 text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
              <Key className="w-3.5 h-3.5 shrink-0" /> id (PK, INT)
            </li>
            <li className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <ArrowRight className="w-3.5 h-3.5 shrink-0" /> book_id (FK → books.id)
            </li>
            <li className="pl-5 text-slate-600 dark:text-slate-400">chapter_number (INT)</li>
          </ul>
        </div>

        {/* Table 4: verses */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">verses</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-500">1:N with chapters</span>
          </div>

          <ul className="text-xs font-mono space-y-2 text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
              <Key className="w-3.5 h-3.5 shrink-0" /> id (PK, INT)
            </li>
            <li className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <ArrowRight className="w-3.5 h-3.5 shrink-0" /> chapter_id (FK → chapters.id)
            </li>
            <li className="pl-5 text-slate-600 dark:text-slate-400">verse_number (INT)</li>
            <li className="pl-5 text-slate-600 dark:text-slate-400">scripture_text (TEXT)</li>
            <li className="pl-5 text-emerald-600 dark:text-emerald-400 font-semibold">verse_title (Indexed)</li>
          </ul>
        </div>
      </div>

      {/* Full Raw DDL SQL Code Block */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-sm font-mono">
            <Code className="w-4 h-4 text-emerald-400" />
            <span>schema.postgresql.sql</span>
          </div>
          <button
            onClick={copySql}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copied SQL' : 'Copy DDL'}</span>
          </button>
        </div>

        <pre className="font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
          {rawSqlSchema}
        </pre>
      </div>
    </div>
  );
};
