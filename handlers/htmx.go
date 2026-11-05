package handlers

import (
	"database/sql"
	"fmt"
	"html/template"
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
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// GetBooksOptions returns HTML <option> tags for books filtered by volume_id
// Handles dynamic volume selection (e.g. Old Testament gives Genesis, NOT Luke)
func (h *HTMXHandler) GetBooksOptions(w http.ResponseWriter, r *http.Request) {
	volIDStr := r.URL.Query().Get("volume_id")
	volID, _ := strconv.Atoi(volIDStr)

	rows, err := h.db.Query("SELECT id, book_title FROM books WHERE volume_id = $1 ORDER BY id", volID)
	if err != nil {
		http.Error(w, "<option value=''>Error loading books</option>", http.StatusOK)
		return
	}
	defer rows.Close()

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprintln(w, "<option value=''>-- Select Book --</option>")
	for rows.Next() {
		var id int
		var title string
		if err := rows.Scan(&id, &title); err == nil {
			fmt.Fprintf(w, "<option value='%d'>%s</option>\n", id, title)
		}
	}
}

// GetChaptersOptions returns HTML <option> tags for chapters filtered by book_id
func (h *HTMXHandler) GetChaptersOptions(w http.ResponseWriter, r *http.Request) {
	bookIDStr := r.URL.Query().Get("book_id")
	bookID, _ := strconv.Atoi(bookIDStr)

	rows, err := h.db.Query("SELECT id, chapter_number FROM chapters WHERE book_id = $1 ORDER BY chapter_number", bookID)
	if err != nil {
		fmt.Fprintln(w, "<option value=''>1</option>")
		return
	}
	defer rows.Close()

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprintln(w, "<option value=''>-- Select Chapter --</option>")
	for rows.Next() {
		var id, chapterNum int
		if err := rows.Scan(&id, &chapterNum); err == nil {
			fmt.Fprintf(w, "<option value='%d' data-chapter='%d'>Chapter %d</option>\n", id, chapterNum, chapterNum)
		}
	}
}

// GetVersesOptions returns HTML <option> tags for verses
func (h *HTMXHandler) GetVersesOptions(w http.ResponseWriter, r *http.Request) {
	chapIDStr := r.URL.Query().Get("chapter_id")
	chapID, _ := strconv.Atoi(chapIDStr)

	rows, err := h.db.Query("SELECT id, verse_number FROM verses WHERE chapter_id = $1 ORDER BY verse_number", chapID)
	if err != nil {
		fmt.Fprintln(w, "<option value=''>1</option>")
		return
	}
	defer rows.Close()

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprintln(w, "<option value=''>-- Select Verse --</option>")
	for rows.Next() {
		var id, verseNum int
		if err := rows.Scan(&id, &verseNum); err == nil {
			fmt.Fprintf(w, "<option value='%d' data-verse='%d'>Verse %d</option>\n", id, verseNum, verseNum)
		}
	}
}

// GetScriptureCard returns HTMX dynamic HTML card with scripture text and SQL log
func (h *HTMXHandler) GetScriptureCard(w http.ResponseWriter, r *http.Request) {
	verseTitle := r.URL.Query().Get("verse_title")
	if verseTitle == "" {
		verseTitle = "John 3:16"
	}

	query := "SELECT scripture_text FROM scriptures WHERE verse_title = $1"
	var text string
	err := h.db.QueryRow(query, verseTitle).Scan(&text)
	if err != nil {
		text = "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
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
  <div class="p-3 bg-slate-950 text-slate-300 rounded-lg font-mono text-xs">
    <div class="text-slate-500 mb-1">// Executed PostgreSQL Query:</div>
    <code class="text-emerald-400">SELECT scripture_text FROM scriptures WHERE verse_title = '%s';</code>
  </div>
</div>`, verseTitle, text, verseTitle)
}
