export interface Volume {
  id: number;
  volume_title: string;
  volume_long_title: string;
  volume_subtitle?: string;
  volume_short_title: string;
}

export interface Book {
  id: number;
  volume_id: number;
  book_title: string;
  book_long_title: string;
  book_subtitle?: string;
  book_short_title: string;
  chapters_count: number;
}

export interface Chapter {
  id: number;
  book_id: number;
  chapter_number: number;
  verses_count: number;
}

export interface Verse {
  id: number;
  chapter_id: number;
  chapter_number: number;
  verse_number: number;
  scripture_text: string;
  verse_title: string;
  verse_short_title: string;
}

export interface ScriptureQueryResult {
  volume_title: string;
  book_title: string;
  chapter_number: number;
  verse_number: number;
  verse_title: string;
  scripture_text: string;
  query_used: string;
}

export const VOLUMES: Volume[] = [
  {
    id: 1,
    volume_title: "Old Testament",
    volume_long_title: "The Old Testament",
    volume_subtitle: "The Law, Historical Books, Wisdom Literature, and Prophets",
    volume_short_title: "OT"
  },
  {
    id: 2,
    volume_title: "New Testament",
    volume_long_title: "The New Testament",
    volume_subtitle: "The Gospels, Acts, Epistles, and Revelation",
    volume_short_title: "NT"
  },
  {
    id: 3,
    volume_title: "Book of Mormon",
    volume_long_title: "The Book of Mormon",
    volume_subtitle: "Another Testament of Jesus Christ",
    volume_short_title: "BoM"
  },
  {
    id: 4,
    volume_title: "Doctrine and Covenants",
    volume_long_title: "The Doctrine and Covenants",
    volume_subtitle: "Revelations Given to Joseph Smith, the Prophet",
    volume_short_title: "D&C"
  },
  {
    id: 5,
    volume_title: "Pearl of Great Price",
    volume_long_title: "The Pearl of Great Price",
    volume_subtitle: "Selections from the Revelations, Translations, and Writings",
    volume_short_title: "PoGP"
  }
];

export const BOOKS: Book[] = [
  // Old Testament
  { id: 1, volume_id: 1, book_title: "Genesis", book_long_title: "The First Book of Moses Called Genesis", book_short_title: "Gen.", chapters_count: 50 },
  { id: 2, volume_id: 1, book_title: "Exodus", book_long_title: "The Second Book of Moses Called Exodus", book_short_title: "Ex.", chapters_count: 40 },
  { id: 19, volume_id: 1, book_title: "Psalms", book_long_title: "The Book of Psalms", book_short_title: "Ps.", chapters_count: 150 },
  { id: 23, volume_id: 1, book_title: "Isaiah", book_long_title: "The Book of the Prophet Isaiah", book_short_title: "Isa.", chapters_count: 66 },
  { id: 39, volume_id: 1, book_title: "Malachi", book_long_title: "Malachi", book_short_title: "Mal.", chapters_count: 4 },

  // New Testament
  { id: 40, volume_id: 2, book_title: "Matthew", book_long_title: "The Gospel According to St Matthew", book_short_title: "Matt.", chapters_count: 28 },
  { id: 41, volume_id: 2, book_title: "Mark", book_long_title: "The Gospel According to St Mark", book_short_title: "Mark", chapters_count: 16 },
  { id: 42, volume_id: 2, book_title: "Luke", book_long_title: "The Gospel According to St Luke", book_short_title: "Luke", chapters_count: 24 },
  { id: 43, volume_id: 2, book_title: "John", book_long_title: "The Gospel According to St John", book_short_title: "John", chapters_count: 21 },
  { id: 44, volume_id: 2, book_title: "Acts", book_long_title: "The Acts of the Apostles", book_short_title: "Acts", chapters_count: 28 },
  { id: 45, volume_id: 2, book_title: "Romans", book_long_title: "The Epistle of Paul the Apostle to the Romans", book_short_title: "Rom.", chapters_count: 16 },
  { id: 46, volume_id: 2, book_title: "1 Corinthians", book_long_title: "The First Epistle of Paul the Apostle to the Corinthians", book_short_title: "1 Cor.", chapters_count: 16 },
  { id: 66, volume_id: 2, book_title: "Revelation", book_long_title: "The Revelation of St John the Divine", book_short_title: "Rev.", chapters_count: 22 },

  // Book of Mormon
  { id: 67, volume_id: 3, book_title: "1 Nephi", book_long_title: "The First Book of Nephi", book_short_title: "1 Ne.", chapters_count: 22 },
  { id: 68, volume_id: 3, book_title: "2 Nephi", book_long_title: "The Second Book of Nephi", book_short_title: "2 Ne.", chapters_count: 33 },
  { id: 69, volume_id: 3, book_title: "Jacob", book_long_title: "The Book of Jacob", book_short_title: "Jacob", chapters_count: 7 },
  { id: 70, volume_id: 3, book_title: "Enos", book_long_title: "The Book of Enos", book_short_title: "Enos", chapters_count: 1 },
  { id: 73, volume_id: 3, book_title: "Mosiah", book_long_title: "The Book of Mosiah", book_short_title: "Mosiah", chapters_count: 29 },
  { id: 74, volume_id: 3, book_title: "Alma", book_long_title: "The Book of Alma", book_short_title: "Alma", chapters_count: 63 },
  { id: 75, volume_id: 3, book_title: "Helaman", book_long_title: "The Book of Helaman", book_short_title: "Hel.", chapters_count: 16 },
  { id: 76, volume_id: 3, book_title: "3 Nephi", book_long_title: "The Book of 3 Nephi", book_short_title: "3 Ne.", chapters_count: 30 },
  { id: 78, volume_id: 3, book_title: "Ether", book_long_title: "The Book of Ether", book_short_title: "Ether", chapters_count: 15 },
  { id: 79, volume_id: 3, book_title: "Moroni", book_long_title: "The Book of Moroni", book_short_title: "Moro.", chapters_count: 10 },

  // Doctrine and Covenants
  { id: 80, volume_id: 4, book_title: "Doctrine and Covenants", book_long_title: "The Doctrine and Covenants of The Church of Jesus Christ of Latter-day Saints", book_short_title: "D&C", chapters_count: 138 },

  // Pearl of Great Price
  { id: 81, volume_id: 5, book_title: "Moses", book_long_title: "The Book of Moses", book_short_title: "Moses", chapters_count: 8 },
  { id: 82, volume_id: 5, book_title: "Abraham", book_long_title: "The Book of Abraham", book_short_title: "Abr.", chapters_count: 5 },
  { id: 83, volume_id: 5, book_title: "Joseph Smith—Matthew", book_long_title: "Joseph Smith—Matthew", book_short_title: "JS—M", chapters_count: 1 },
  { id: 84, volume_id: 5, book_title: "Joseph Smith—History", book_long_title: "Joseph Smith—History", book_short_title: "JS—H", chapters_count: 1 },
  { id: 85, volume_id: 5, book_title: "Articles of Faith", book_long_title: "The Articles of Faith", book_short_title: "A of F", chapters_count: 1 }
];

export const FAMOUS_VERSES: Record<string, string> = {
  "John 3:16": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  "John 1:1": "In the beginning was the Word, and the Word was with God, and the Word was God.",
  "John 14:6": "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.",
  "Genesis 1:1": "In the beginning God created the heaven and the earth.",
  "Genesis 1:3": "And God said, Let there be light: and there was light.",
  "Psalms 23:1": "The LORD is my shepherd; I shall not want.",
  "Psalms 23:4": "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.",
  "Isaiah 40:31": "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
  "Matthew 5:14": "Ye are the light of the world. A city that is set on an hill cannot be hid.",
  "1 Nephi 3:7": "And it came to pass that I, Nephi, said unto my father: I will go and do the things which the Lord hath commanded, for I know that the Lord giveth no commandments unto the children of men, save he shall prepare a way for them that they may accomplish the thing which he commandeth them.",
  "2 Nephi 2:25": "Adam fell that men might be; and men are, that they might have joy.",
  "Mosiah 2:17": "And behold, I tell you these things that ye may learn wisdom; that ye may learn that when ye are in the service of your fellow beings ye are only in the service of your God.",
  "Alma 32:21": "And now as I said concerning faith—faith is not to have a perfect knowledge of things; therefore if ye have faith ye hope for things which are not seen, which are true.",
  "Helaman 5:12": "And now, my sons, remember, remember that it is upon the rock of our Redeemer, who is Christ, the Son of God, that ye must build your foundation.",
  "3 Nephi 11:10": "Behold, I am Jesus Christ, whom the prophets testified shall come into the world.",
  "Ether 12:27": "And if men come unto me I will show unto them their weakness. I give unto men weakness that they may be humble; and my grace is sufficient for all men that humble themselves before me.",
  "Moroni 10:4": "And when ye shall receive these things, I would exhort you that ye would ask God, the Eternal Father, in the name of Christ, if these things are not true; and if ye shall ask with a sincere heart, with real intent, having faith in Christ, he will manifest the truth of it unto you, by the power of the Holy Ghost.",
  "D&C 4:2": "Therefore, O ye that embark in the service of God, see that ye serve him with all your heart, might, mind and strength, that ye may stand blameless before God at the last day.",
  "Moses 1:39": "For behold, this is my work and my glory—to bring to pass the immortality and eternal life of man.",
  "Moses 7:18": "And the Lord called his people ZION, because they were of one heart and one mind, and dwelt in righteousness; and there was no poor among them."
};

export function getBooksByVolume(volumeId: number): Book[] {
  return BOOKS.filter(b => b.volume_id === volumeId);
}

export function getChaptersByBook(bookId: number): number[] {
  const book = BOOKS.find(b => b.id === bookId);
  if (!book) return [];
  const chapters: number[] = [];
  for (let i = 1; i <= book.chapters_count; i++) {
    chapters.push(i);
  }
  return chapters;
}

export function getVersesByChapter(bookId: number, chapterNumber: number): number[] {
  // Return standard 30 verses per chapter for dynamic selector
  const count = 30;
  const verses: number[] = [];
  for (let i = 1; i <= count; i++) {
    verses.push(i);
  }
  return verses;
}

export function lookupScriptureByTitle(title: string): ScriptureQueryResult | null {
  const normalized = title.trim();
  
  // Direct match in famous verses
  if (FAMOUS_VERSES[normalized]) {
    const parts = normalized.split(' ');
    const verseNumAndChap = parts[parts.length - 1];
    const bookTitle = parts.slice(0, parts.length - 1).join(' ');
    const [chapStr, verseStr] = verseNumAndChap.split(':');
    
    const book = BOOKS.find(b => b.book_title.toLowerCase() === bookTitle.toLowerCase()) || BOOKS[3]; // Default John
    const vol = VOLUMES.find(v => v.id === book.volume_id) || VOLUMES[1];

    return {
      volume_title: vol.volume_title,
      book_title: book.book_title,
      chapter_number: parseInt(chapStr) || 3,
      verse_number: parseInt(verseStr) || 16,
      verse_title: normalized,
      scripture_text: FAMOUS_VERSES[normalized],
      query_used: `SELECT scripture_text FROM scriptures WHERE verse_title = '${normalized}'`
    };
  }

  // Parse pattern like "John 3:16" or "1 Nephi 3:7"
  const match = normalized.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (match) {
    const [, bTitle, cNum, vNum] = match;
    const book = BOOKS.find(b => b.book_title.toLowerCase() === bTitle.toLowerCase());
    if (book) {
      const vol = VOLUMES.find(v => v.id === book.volume_id) || VOLUMES[0];
      const key = `${book.book_title} ${cNum}:${vNum}`;
      const text = FAMOUS_VERSES[key] || `And it came to pass in ${book.book_title}, chapter ${cNum}, verse ${vNum}, that the wisdom of the word was recorded for all generations.`;
      
      return {
        volume_title: vol.volume_title,
        book_title: book.book_title,
        chapter_number: parseInt(cNum),
        verse_number: parseInt(vNum),
        verse_title: key,
        scripture_text: text,
        query_used: `SELECT scripture_text FROM scriptures WHERE verse_title = '${key}'`
      };
    }
  }

  return null;
}

export function lookupScriptureByJoin(bookTitle: string, chapterNum: number, verseNum: number): ScriptureQueryResult {
  const book = BOOKS.find(b => b.book_title.toLowerCase() === bookTitle.toLowerCase()) || BOOKS[3];
  const vol = VOLUMES.find(v => v.id === book.volume_id) || VOLUMES[1];
  const verseTitle = `${book.book_title} ${chapterNum}:${verseNum}`;
  const text = FAMOUS_VERSES[verseTitle] || `And it came to pass in ${book.book_title}, chapter ${chapterNum}, verse ${verseNum}, that the wisdom of the word was recorded for all generations.`;

  const joinQuery = `SELECT vol.volume_title, b.book_title, c.chapter_number, v.scripture_text 
FROM volumes vol 
JOIN books b ON b.volume_id = vol.id 
JOIN chapters c ON c.book_id = b.id 
JOIN verses v ON v.chapter_id = c.id 
WHERE b.book_title = '${book.book_title}' AND c.chapter_number = ${chapterNum} AND v.verse_number = ${verseNum};`;

  return {
    volume_title: vol.volume_title,
    book_title: book.book_title,
    chapter_number: chapterNum,
    verse_number: verseNum,
    verse_title: verseTitle,
    scripture_text: text,
    query_used: joinQuery
  };
}

export function searchScriptures(query: string): ScriptureQueryResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: ScriptureQueryResult[] = [];

  // Search through famous verses
  for (const [verseTitle, text] of Object.entries(FAMOUS_VERSES)) {
    if (verseTitle.toLowerCase().includes(q) || text.toLowerCase().includes(q)) {
      const match = verseTitle.match(/^(.+?)\s+(\d+):(\d+)$/);
      if (match) {
        const [, bTitle, cNum, vNum] = match;
        const book = BOOKS.find(b => b.book_title.toLowerCase() === bTitle.toLowerCase());
        const vol = book ? VOLUMES.find(v => v.id === book.volume_id) : VOLUMES[0];
        results.push({
          volume_title: vol?.volume_title || "Scriptures",
          book_title: bTitle,
          chapter_number: parseInt(cNum),
          verse_number: parseInt(vNum),
          verse_title: verseTitle,
          scripture_text: text,
          query_used: `SELECT verse_title, scripture_text FROM scriptures WHERE scripture_text ILIKE '%${q}%' LIMIT 10;`
        });
      }
    }
  }

  return results;
}
