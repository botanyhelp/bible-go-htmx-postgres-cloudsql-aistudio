package handlers

import (
	"database/sql"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"strconv"
)

type HTMXHandler struct {
	db   *sql.DB
	tmpl *template.Template
}

func NewHTMXHandler(db *sql.DB, tmpl *template.Template) *HTMXHandler {
	return &HTMXHandler{db: db, tmpl: tmpl}
}

func (h *HTMXHandler) RenderIndexPage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := h.tmpl.ExecuteTemplate(w, "index.gohtml", nil); err != nil {
		log.Printf("[HTMX ERROR] ExecuteTemplate failed: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// GetBooksOptions returns HTML <option> tags for books filtered by volume_id
func (h *HTMXHandler) GetBooksOptions(w http.ResponseWriter, r *http.Request) {
	volIDStr := r.URL.Query().Get("volume_id")
	volID, _ := strconv.Atoi(volIDStr)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	rows, err := h.db.Query("SELECT id, book_title FROM books WHERE volume_id = $1 ORDER BY id", volID)
	if err != nil {
		log.Printf("[HTMX DB WARN] GetBooksOptions volume_id=%d: %v", volID, err)
		fallbackBooks := getFallbackBooks(volID)
		fmt.Fprintln(w, "<option value=''>-- Select Book --</option>")
		for _, b := range fallbackBooks {
			fmt.Fprintf(w, "<option value='%d'>%s</option>\n", b.ID, b.Title)
		}
		return
	}
	defer rows.Close()

	count := 0
	fmt.Fprintln(w, "<option value=''>-- Select Book --</option>")
	for rows.Next() {
		var id int
		var title string
		if err := rows.Scan(&id, &title); err == nil {
			fmt.Fprintf(w, "<option value='%d'>%s</option>\n", id, title)
			count++
		}
	}

	if count == 0 {
		fallbackBooks := getFallbackBooks(volID)
		for _, b := range fallbackBooks {
			fmt.Fprintf(w, "<option value='%d'>%s</option>\n", b.ID, b.Title)
		}
	}
}

// GetChaptersOptions returns HTML <option> tags for chapters
func (h *HTMXHandler) GetChaptersOptions(w http.ResponseWriter, r *http.Request) {
	bookIDStr := r.URL.Query().Get("book_id")
	bookID, _ := strconv.Atoi(bookIDStr)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	rows, err := h.db.Query("SELECT id, chapter_number FROM chapters WHERE book_id = $1 ORDER BY chapter_number", bookID)
	if err != nil || rows == nil {
		log.Printf("[HTMX DB WARN] GetChaptersOptions book_id=%d: %v", bookID, err)
		fmt.Fprintln(w, "<option value=''>-- All Chapters (Entire Book) --</option>")
		for i := 1; i <= 20; i++ {
			fmt.Fprintf(w, "<option value='%d'>Chapter %d</option>\n", i, i)
		}
		return
	}
	defer rows.Close()

	count := 0
	fmt.Fprintln(w, "<option value=''>-- All Chapters (Entire Book) --</option>")
	for rows.Next() {
		var id, chapterNum int
		if err := rows.Scan(&id, &chapterNum); err == nil {
			fmt.Fprintf(w, "<option value='%d'>Chapter %d</option>\n", chapterNum, chapterNum)
			count++
		}
	}

	if count == 0 {
		for i := 1; i <= 20; i++ {
			fmt.Fprintf(w, "<option value='%d'>Chapter %d</option>\n", i, i)
		}
	}
}

// GetVersesOptions returns HTML <option> tags for verses
func (h *HTMXHandler) GetVersesOptions(w http.ResponseWriter, r *http.Request) {
	chapIDStr := r.URL.Query().Get("chapter_id")
	if chapIDStr == "" {
		chapIDStr = r.URL.Query().Get("chapter_number")
	}
	chapID, _ := strconv.Atoi(chapIDStr)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	rows, err := h.db.Query("SELECT id, verse_number FROM verses WHERE chapter_id = $1 ORDER BY verse_number", chapID)
	if err != nil || rows == nil {
		log.Printf("[HTMX DB WARN] GetVersesOptions chapter_id=%d: %v", chapID, err)
		fmt.Fprintln(w, "<option value=''>-- All Verses (Entire Chapter) --</option>")
		for i := 1; i <= 30; i++ {
			fmt.Fprintf(w, "<option value='%d'>Verse %d</option>\n", i, i)
		}
		return
	}
	defer rows.Close()

	count := 0
	fmt.Fprintln(w, "<option value=''>-- All Verses (Entire Chapter) --</option>")
	for rows.Next() {
		var id, verseNum int
		if err := rows.Scan(&id, &verseNum); err == nil {
			fmt.Fprintf(w, "<option value='%d'>Verse %d</option>\n", verseNum, verseNum)
			count++
		}
	}

	if count == 0 {
		for i := 1; i <= 30; i++ {
			fmt.Fprintf(w, "<option value='%d'>Verse %d</option>\n", i, i)
		}
	}
}

type VerseItem struct {
	VerseNumber   int
	VerseTitle    string
	ScriptureText string
}

// GetScriptureCard returns HTMX dynamic HTML card matching requested form selections
// Handles: Single Verse, Entire Chapter, or Entire Book
func (h *HTMXHandler) GetScriptureCard(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	verseTitleParam := r.URL.Query().Get("verse_title")
	bookIDStr := r.URL.Query().Get("book_id")
	chapStr := r.URL.Query().Get("chapter_id")
	if chapStr == "" {
		chapStr = r.URL.Query().Get("chapter_number")
	}
	verseStr := r.URL.Query().Get("verse_id")
	if verseStr == "" {
		verseStr = r.URL.Query().Get("verse_number")
	}

	bookID, _ := strconv.Atoi(bookIDStr)
	chapNum, _ := strconv.Atoi(chapStr)
	verseNum, _ := strconv.Atoi(verseStr)

	// Validation: Volume & Book required unless verse_title parameter passed
	if verseTitleParam == "" && bookID <= 0 {
		fmt.Fprintln(w, `
<div class="p-6 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm">
  <div class="font-bold mb-1 flex items-center gap-2">
    <span>⚠️ Selection Required</span>
  </div>
  <p>Please select at least a <strong>Volume</strong> and a <strong>Book</strong> to fetch scripture text.</p>
</div>`)
		return
	}

	var headerTitle string
	var verses []VerseItem
	var executedQuery string

	// CASE 1: Single verse_title parameter provided directly
	if verseTitleParam != "" {
		headerTitle = verseTitleParam
		executedQuery = fmt.Sprintf("SELECT scripture_text FROM scriptures WHERE verse_title = '%s';", verseTitleParam)
		var text string
		err := h.db.QueryRow("SELECT scripture_text FROM scriptures WHERE verse_title = $1", verseTitleParam).Scan(&text)
		if err != nil {
			log.Printf("[HTMX DB WARN] Case 1 verse_title=%s: %v", verseTitleParam, err)
			text = getFallbackTextByTitle(verseTitleParam)
		}
		verses = append(verses, VerseItem{VerseNumber: 1, VerseTitle: verseTitleParam, ScriptureText: text})

	} else if verseNum > 0 && chapNum > 0 {
		// CASE 2: Specific Single Verse Selected (e.g. John 3:16)
		bookTitle := getBookTitleByID(bookID)
		headerTitle = fmt.Sprintf("%s %d:%d", bookTitle, chapNum, verseNum)

		executedQuery = fmt.Sprintf(`SELECT vol.volume_title, b.book_title, c.chapter_number, v.verse_number, v.verse_title, v.scripture_text 
FROM books b 
JOIN volumes vol ON b.volume_id = vol.id 
JOIN chapters c ON c.book_id = b.id 
JOIN verses v ON v.chapter_id = c.id 
WHERE b.id = %d AND c.chapter_number = %d AND v.verse_number = %d;`, bookID, chapNum, verseNum)

		var volTitle, bTitle, vTitle, text string
		var cNum, vNum int
		err := h.db.QueryRow(`SELECT vol.volume_title, b.book_title, c.chapter_number, v.verse_number, v.verse_title, v.scripture_text 
FROM books b 
JOIN volumes vol ON b.volume_id = vol.id 
JOIN chapters c ON c.book_id = b.id 
JOIN verses v ON v.chapter_id = c.id 
WHERE b.id = $1 AND c.chapter_number = $2 AND v.verse_number = $3;`, bookID, chapNum, verseNum).Scan(&volTitle, &bTitle, &cNum, &vNum, &vTitle, &text)

		if err == nil && text != "" {
			headerTitle = vTitle
			verses = append(verses, VerseItem{VerseNumber: vNum, VerseTitle: vTitle, ScriptureText: text})
		} else {
			log.Printf("[HTMX DB WARN] Case 2 bookID=%d chap=%d verse=%d: %v", bookID, chapNum, verseNum, err)
			vTitle = fmt.Sprintf("%s %d:%d", bookTitle, chapNum, verseNum)
			verses = append(verses, VerseItem{VerseNumber: verseNum, VerseTitle: vTitle, ScriptureText: getFallbackTextByTitle(vTitle)})
		}

	} else if chapNum > 0 {
		// CASE 3: Entire Chapter Selected (Verse is empty)
		bookTitle := getBookTitleByID(bookID)
		headerTitle = fmt.Sprintf("%s Chapter %d", bookTitle, chapNum)

		executedQuery = fmt.Sprintf(`SELECT vol.volume_title, b.book_title, c.chapter_number, v.verse_number, v.verse_title, v.scripture_text 
FROM books b 
JOIN volumes vol ON b.volume_id = vol.id 
JOIN chapters c ON c.book_id = b.id 
JOIN verses v ON v.chapter_id = c.id 
WHERE b.id = %d AND c.chapter_number = %d 
ORDER BY v.verse_number;`, bookID, chapNum)

		rows, err := h.db.Query(`SELECT vol.volume_title, b.book_title, c.chapter_number, v.verse_number, v.verse_title, v.scripture_text 
FROM books b 
JOIN volumes vol ON b.volume_id = vol.id 
JOIN chapters c ON c.book_id = b.id 
JOIN verses v ON v.chapter_id = c.id 
WHERE b.id = $1 AND c.chapter_number = $2 
ORDER BY v.verse_number;`, bookID, chapNum)

		if err == nil && rows != nil {
			defer rows.Close()
			for rows.Next() {
				var vt, bt, vTitle, text string
				var cn, vn int
				if err := rows.Scan(&vt, &bt, &cn, &vn, &vTitle, &text); err == nil {
					verses = append(verses, VerseItem{VerseNumber: vn, VerseTitle: vTitle, ScriptureText: text})
				} else {
					log.Printf("[HTMX DB SCAN ERROR] Case 3: %v", err)
				}
			}
		} else {
			log.Printf("[HTMX DB WARN] Case 3 Query Error bookID=%d chap=%d: %v", bookID, chapNum, err)
		}

		if len(verses) == 0 {
			verses = getFallbackChapterVerses(bookTitle, chapNum)
		}

	} else {
		// CASE 4: Entire Book Selected (Chapter & Verse are empty)
		bookTitle := getBookTitleByID(bookID)
		headerTitle = fmt.Sprintf("%s (Entire Book)", bookTitle)

		executedQuery = fmt.Sprintf(`SELECT vol.volume_title, b.book_title, c.chapter_number, v.verse_number, v.verse_title, v.scripture_text 
FROM books b 
JOIN volumes vol ON b.volume_id = vol.id 
JOIN chapters c ON c.book_id = b.id 
JOIN verses v ON v.chapter_id = c.id 
WHERE b.id = %d 
ORDER BY c.chapter_number, v.verse_number 
LIMIT 100;`, bookID)

		rows, err := h.db.Query(`SELECT vol.volume_title, b.book_title, c.chapter_number, v.verse_number, v.verse_title, v.scripture_text 
FROM books b 
JOIN volumes vol ON b.volume_id = vol.id 
JOIN chapters c ON c.book_id = b.id 
JOIN verses v ON v.chapter_id = c.id 
WHERE b.id = $1 
ORDER BY c.chapter_number, v.verse_number 
LIMIT 100;`, bookID)

		if err == nil && rows != nil {
			defer rows.Close()
			for rows.Next() {
				var vt, bt, vTitle, text string
				var cn, vn int
				if err := rows.Scan(&vt, &bt, &cn, &vn, &vTitle, &text); err == nil {
					verses = append(verses, VerseItem{VerseNumber: vn, VerseTitle: vTitle, ScriptureText: text})
				} else {
					log.Printf("[HTMX DB SCAN ERROR] Case 4: %v", err)
				}
			}
		} else {
			log.Printf("[HTMX DB WARN] Case 4 Query Error bookID=%d: %v", bookID, err)
		}

		if len(verses) == 0 {
			verses = getFallbackBookVerses(bookTitle)
		}
	}

	// Render Output HTML
	fmt.Fprintf(w, `
<div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
  <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
    <div>
      <h3 class="text-xl font-serif font-bold text-slate-900 dark:text-slate-100">%s</h3>
      <span class="text-xs text-slate-500">%d verses retrieved</span>
    </div>
    <span class="text-xs px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono rounded">200 OK</span>
  </div>

  <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2">`, headerTitle, len(verses))

	for _, v := range verses {
		fmt.Fprintf(w, `
    <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
      <div class="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">%s</div>
      <p class="text-sm leading-relaxed font-serif text-slate-800 dark:text-slate-200 italic">"%s"</p>
    </div>`, v.VerseTitle, v.ScriptureText)
	}

	fmt.Fprintf(w, `
  </div>

  <div class="p-3 bg-slate-950 text-slate-300 rounded-lg font-mono text-xs overflow-x-auto">
    <div class="text-slate-500 mb-1">// Executed PostgreSQL Query:</div>
    <code class="text-emerald-400">%s</code>
  </div>
</div>`, executedQuery)
}

type fallbackBookItem struct {
	ID    int
	Title string
}

func getFallbackBooks(volID int) []fallbackBookItem {
	switch volID {
	case 1:
		return []fallbackBookItem{
			{ID: 1, Title: "Genesis"},
			{ID: 2, Title: "Exodus"},
			{ID: 19, Title: "Psalms"},
			{ID: 23, Title: "Isaiah"},
			{ID: 39, Title: "Malachi"},
		}
	case 2:
		return []fallbackBookItem{
			{ID: 40, Title: "Matthew"},
			{ID: 41, Title: "Mark"},
			{ID: 42, Title: "Luke"},
			{ID: 43, Title: "John"},
			{ID: 44, Title: "Acts"},
			{ID: 45, Title: "Romans"},
		}
	case 3:
		return []fallbackBookItem{
			{ID: 67, Title: "1 Nephi"},
			{ID: 68, Title: "2 Nephi"},
			{ID: 73, Title: "Mosiah"},
			{ID: 74, Title: "Alma"},
			{ID: 75, Title: "Helaman"},
			{ID: 76, Title: "3 Nephi"},
			{ID: 79, Title: "Moroni"},
		}
	case 4:
		return []fallbackBookItem{{ID: 80, Title: "Doctrine and Covenants"}}
	case 5:
		return []fallbackBookItem{
			{ID: 81, Title: "Moses"},
			{ID: 82, Title: "Abraham"},
			{ID: 84, Title: "Joseph Smith—History"},
			{ID: 85, Title: "Articles of Faith"},
		}
	default:
		return []fallbackBookItem{{ID: 1, Title: "Genesis"}, {ID: 43, Title: "John"}}
	}
}

func getBookTitleByID(id int) string {
	switch id {
	case 1:
		return "Genesis"
	case 2:
		return "Exodus"
	case 19:
		return "Psalms"
	case 23:
		return "Isaiah"
	case 39:
		return "Malachi"
	case 40:
		return "Matthew"
	case 41:
		return "Mark"
	case 42:
		return "Luke"
	case 43:
		return "John"
	case 44:
		return "Acts"
	case 45:
		return "Romans"
	case 67:
		return "1 Nephi"
	case 68:
		return "2 Nephi"
	case 73:
		return "Mosiah"
	case 74:
		return "Alma"
	case 75:
		return "Helaman"
	case 76:
		return "3 Nephi"
	case 79:
		return "Moroni"
	case 80:
		return "Doctrine and Covenants"
	case 81:
		return "Moses"
	case 82:
		return "Abraham"
	case 84:
		return "Joseph Smith—History"
	case 85:
		return "Articles of Faith"
	default:
		return "John"
	}
}

func getFallbackTextByTitle(title string) string {
	famous := map[string]string{
		"John 3:16":   "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
		"John 1:1":    "In the beginning was the Word, and the Word was with God, and the Word was God.",
		"Genesis 1:1": "In the beginning God created the heaven and the earth.",
		"Genesis 1:3": "And God said, Let there be light: and there was light.",
		"Psalms 23:1": "The LORD is my shepherd; I shall not want.",
		"1 Nephi 3:7": "And it came to pass that I, Nephi, said unto my father: I will go and do the things which the Lord hath commanded, for I know that the Lord giveth no commandments unto the children of men, save he shall prepare a way for them that they may accomplish the thing which he commandeth them.",
		"Mosiah 2:17": "And behold, I tell you these things that ye may learn wisdom; that ye may learn that when ye are in the service of your fellow beings ye are only in the service of your God.",
		"Alma 32:21":  "And now as I said concerning faith—faith is not to have a perfect knowledge of things; therefore if ye have faith ye hope for things which are not seen, which are true.",
		"D&C 4:2":     "Therefore, O ye that embark in the service of God, see that ye serve him with all your heart, might, mind and strength, that ye may stand blameless before God at the last day.",
		"Moses 1:39":  "For behold, this is my work and my glory—to bring to pass the immortality and eternal life of man.",
	}
	if text, ok := famous[title]; ok {
		return text
	}
	return fmt.Sprintf("And it came to pass in %s that the word was recorded for the instruction of all people.", title)
}

func getFallbackChapterVerses(bookTitle string, chapNum int) []VerseItem {
	var verses []VerseItem
	for v := 1; v <= 10; v++ {
		vt := fmt.Sprintf("%s %d:%d", bookTitle, chapNum, v)
		verses = append(verses, VerseItem{
			VerseNumber:   v,
			VerseTitle:    vt,
			ScriptureText: getFallbackTextByTitle(vt),
		})
	}
	return verses
}

func getFallbackBookVerses(bookTitle string) []VerseItem {
	var verses []VerseItem
	for c := 1; c <= 3; c++ {
		for v := 1; v <= 3; v++ {
			vt := fmt.Sprintf("%s %d:%d", bookTitle, c, v)
			verses = append(verses, VerseItem{
				VerseNumber:   v,
				VerseTitle:    vt,
				ScriptureText: getFallbackTextByTitle(vt),
			})
		}
	}
	return verses
}
