-- PostgreSQL Schema for LDS Scriptures Database
-- Source: https://raw.githubusercontent.com/beandog/lds-scriptures/refs/heads/master/postgresql/schema.txt

CREATE TABLE IF NOT EXISTS volumes (
    id SERIAL PRIMARY KEY,
    volume_title VARCHAR(255) NOT NULL,
    volume_long_title VARCHAR(255) NOT NULL,
    volume_subtitle VARCHAR(255),
    volume_short_title VARCHAR(50) NOT NULL,
    lds_gospel_art_book_id INT
);

CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    volume_id INT NOT NULL REFERENCES volumes(id) ON DELETE CASCADE,
    book_title VARCHAR(255) NOT NULL,
    book_long_title VARCHAR(255) NOT NULL,
    book_subtitle VARCHAR(255),
    book_short_title VARCHAR(50) NOT NULL,
    lds_gospel_art_book_id INT
);

CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    book_id INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    chapter_number INT NOT NULL
);

CREATE TABLE IF NOT EXISTS verses (
    id SERIAL PRIMARY KEY,
    chapter_id INT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    verse_number INT NOT NULL,
    scripture_text TEXT NOT NULL,
    verse_title VARCHAR(255) NOT NULL,
    verse_short_title VARCHAR(255) NOT NULL
);

-- Denormalized Scriptures View for high-speed verse_title lookups
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

-- High-performance query indexes
CREATE INDEX IF NOT EXISTS idx_books_volume_id ON books(volume_id);
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_verses_chapter_id ON verses(chapter_id);
CREATE INDEX IF NOT EXISTS idx_verses_verse_title ON verses(verse_title);
CREATE INDEX IF NOT EXISTS idx_verses_text_fts ON verses USING gin(to_tsvector('english', scripture_text));
