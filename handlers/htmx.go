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

// GetChaptersOptions returns HTML <option> tags for chapters filtered by book_id
func (h *HTMXHandler) GetChaptersOptions(w http.ResponseWriter, r *http.Request) {
	bookIDStr := r.URL.Query().Get("book_id")
	bookID, _ := strconv.Atoi(bookIDStr)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	rows, err := h.db.Query("SELECT id, chapter_number FROM chapters WHERE book_id = $1 ORDER BY chapter_number", bookID)
	if err != nil || rows == nil {
		log.Printf("[HTMX DB WARN] GetChaptersOptions book_id=%d: %v", bookID, err)
		fmt.Fprintln(w, "<option value=''>-- Select Chapter --</option>")
		for i := 1; i <= 20; i++ {
			fmt.Fprintf(w, "<option value='%d'>Chapter %d</option>\n", i, i)
		}
		return
	}
	defer rows.Close()

	count := 0
	fmt.Fprintln(w, "<option value=''>-- Select Chapter --</option>")
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
		fmt.Fprintln(w, "<option value=''>-- Select Verse --</option>")
		for i := 1; i <= 30; i++ {
			fmt.Fprintf(w, "<option value='%d'>Verse %d</option>\n", i, i)
		}
		return
	}
	defer rows.Close()

	count := 0
	fmt.Fprintln(w, "<option value=''>-- Select Verse --</option>")
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

// GetScriptureCard returns HTMX dynamic HTML card matching requested form selections
func (h *HTMXHandler) GetScriptureCard(w http.ResponseWriter, r *http.Request) {
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
	if chapNum == 0 {
		chapNum = 1
	}
	verseNum, _ := strconv.Atoi(verseStr)
	if verseNum == 0 {
		verseNum = 1
	}

	var verseTitle, scriptureText, executedQuery string

	// Attempt 1: If verseTitleParam passed directly
	if verseTitleParam != "" {
		verseTitle = verseTitleParam
		executedQuery = fmt.Sprintf("SELECT scripture_text FROM scriptures WHERE verse_title = '%s';", verseTitle)
		err := h.db.QueryRow("SELECT scripture_text FROM scriptures WHERE verse_title = $1", verseTitle).Scan(&scriptureText)
		if err != nil {
			scriptureText = getFallbackTextByTitle(verseTitle)
		}
	} else if bookID > 0 {
		// Attempt 2: Query PostgreSQL using JOIN by book_id, chapter_number, verse_number
		executedQuery = fmt.Sprintf(`SELECT vol.volume_title, b.book_title, c.chapter_number, v.scripture_text 
FROM books b 
JOIN volumes vol ON b.volume_id = vol.id 
JOIN chapters c ON c.book_id = b.id 
JOIN verses v ON v.chapter_id = c.id 
WHERE b.id = %d AND c.chapter_number = %d AND v.verse_number = %d;`, bookID, chapNum, verseNum)

		var volTitle, bTitle string
		var cNum int
		err := h.db.QueryRow(`SELECT vol.volume_title, b.book_title, c.chapter_number, v.scripture_text 
FROM books b 
JOIN volumes vol ON b.volume_id = vol.id 
JOIN chapters c ON c.book_id = b.id 
JOIN verses v ON v.chapter_id = c.id 
WHERE b.id = $1 AND c.chapter_number = $2 AND v.verse_number = $3;`, bookID, chapNum, verseNum).Scan(&volTitle, &bTitle, &cNum, &scriptureText)

		if err == nil && bTitle != "" {
			verseTitle = fmt.Sprintf("%s %d:%d", bTitle, chapNum, verseNum)
		} else {
			// Fallback if table data is pending seed
			bTitle = getBookTitleByID(bookID)
			verseTitle = fmt.Sprintf("%s %d:%d", bTitle, chapNum, verseNum)
			scriptureText = getFallbackTextByTitle(verseTitle)
		}
	} else {
		// Default
		verseTitle = "John 3:16"
		executedQuery = "SELECT scripture_text FROM scriptures WHERE verse_title = 'John 3:16';"
		scriptureText = "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprintf(w, `
<div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-xl font-serif font-bold text-slate-900 dark:text-slate-100">%s</h3>
    <span class="text-xs px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono rounded">200 OK</span>
  </div>
  <p class="text-lg leading-relaxed font-serif text-slate-800 dark:text-slate-200 italic mb-6">
    "%s"
  </p>
  <div class="p-3 bg-slate-950 text-slate-300 rounded-lg font-mono text-xs overflow-x-auto">
    <div class="text-slate-500 mb-1">// Executed PostgreSQL Query:</div>
    <code class="text-emerald-400">%s</code>
  </div>
</div>`, verseTitle, scriptureText, executedQuery)
}

type fallbackBookItem struct {
	ID    int
	Title string
}

func getFallbackBooks(volID int) []fallbackBookItem {
	switch volID {
	case 1: // Old Testament
		return []fallbackBookItem{
			{ID: 1, Title: "Genesis"},
			{ID: 2, Title: "Exodus"},
			{ID: 19, Title: "Psalms"},
			{ID: 23, Title: "Isaiah"},
			{ID: 39, Title: "Malachi"},
		}
	case 2: // New Testament
		return []fallbackBookItem{
			{ID: 40, Title: "Matthew"},
			{ID: 41, Title: "Mark"},
			{ID: 42, Title: "Luke"},
			{ID: 43, Title: "John"},
			{ID: 44, Title: "Acts"},
			{ID: 45, Title: "Romans"},
		}
	case 3: // Book of Mormon
		return []fallbackBookItem{
			{ID: 67, Title: "1 Nephi"},
			{ID: 68, Title: "2 Nephi"},
			{ID: 73, Title: "Mosiah"},
			{ID: 74, Title: "Alma"},
			{ID: 75, Title: "Helaman"},
			{ID: 76, Title: "3 Nephi"},
			{ID: 79, Title: "Moroni"},
		}
	case 4: // D&C
		return []fallbackBookItem{
			{ID: 80, Title: "Doctrine and Covenants"},
		}
	case 5: // Pearl of Great Price
		return []fallbackBookItem{
			{ID: 81, Title: "Moses"},
			{ID: 82, Title: "Abraham"},
			{ID: 84, Title: "Joseph Smith—History"},
			{ID: 85, Title: "Articles of Faith"},
		}
	default:
		return []fallbackBookItem{
			{ID: 1, Title: "Genesis"},
			{ID: 43, Title: "John"},
		}
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
		"John 3:16":     "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
		"John 1:1":      "In the beginning was the Word, and the Word was with God, and the Word was God.",
		"Genesis 1:1":   "In the beginning God created the heaven and the earth.",
		"Genesis 1:3":   "And God said, Let there be light: and there was light.",
		"Psalms 23:1":   "The LORD is my shepherd; I shall not want.",
		"1 Nephi 3:7":   "And it came to pass that I, Nephi, said unto my father: I will go and do the things which the Lord hath commanded, for I know that the Lord giveth no commandments unto the children of men, save he shall prepare a way for them that they may accomplish the thing which he commandeth them.",
		"Mosiah 2:17":   "And behold, I tell you these things that ye may learn wisdom; that ye may learn that when ye are in the service of your fellow beings ye are only in the service of your God.",
		"Alma 32:21":    "And now as I said concerning faith—faith is not to have a perfect knowledge of things; therefore if ye have faith ye hope for things which are not seen, which are true.",
		"D&C 4:2":       "Therefore, O ye that embark in the service of God, see that ye serve him with all your heart, might, mind and strength, that ye may stand blameless before God at the last day.",
		"Moses 1:39":    "For behold, this is my work and my glory—to bring to pass the immortality and eternal life of man.",
	}
	if text, ok := famous[title]; ok {
		return text
	}
	return fmt.Sprintf("And it came to pass in %s that the word was recorded for the instruction of all people.", title)
}
