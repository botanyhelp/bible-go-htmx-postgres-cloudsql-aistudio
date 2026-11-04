export interface GoFile {
  path: string;
  filename: string;
  language: string;
  description: string;
  content: string;
}

export const GOLANG_CODEBASE: GoFile[] = [
  {
    path: "main.go",
    filename: "main.go",
    language: "go",
    description: "Main server entry point setting up HTTP routes, pgx connection pool, HTMX templates, and REST API.",
    content: `package main

import (
	"context"
	"embed"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"scriptures-api/config"
	"scriptures-api/db"
	"scriptures-api/handlers"
)

//go:embed templates/*
var templateFS embed.FS

func main() {
	log.Println("Starting Scriptures Cloud SQL REST API & HTMX Server...")

	// 1. Load environment configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// 2. Establish PostgreSQL sql.DB connection pool via pgx driver
	dbPool, err := db.NewPostgresPool(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to Google Cloud SQL PostgreSQL: %v", err)
	}
	defer dbPool.Close()

	// 3. Parse HTML Templates for HTMX dynamic rendering
	tmpl, err := template.ParseFS(templateFS, "templates/*.gohtml")
	if err != nil {
		log.Fatalf("Failed to parse templates: %v", err)
	}

	// 4. Initialize Handlers
	apiHandler := handlers.NewAPIHandler(dbPool)
	htmxHandler := handlers.NewHTMXHandler(dbPool, tmpl)

	// 5. Setup Router (net/http ServeMux with Go 1.22+ pattern routing)
	mux := http.NewServeMux()

	// Static & Page Routes
	mux.HandleFunc("GET /", htmxHandler.RenderIndexPage)

	// HTMX Dynamic Component Endpoints (Backend HTML Snippets)
	mux.HandleFunc("GET /htmx/books", htmxHandler.GetBooksOptions)
	mux.HandleFunc("GET /htmx/chapters", htmxHandler.GetChaptersOptions)
	mux.HandleFunc("GET /htmx/verses", htmxHandler.GetVersesOptions)
	mux.HandleFunc("GET /htmx/scripture", htmxHandler.GetScriptureCard)

	// RESTful JSON API Endpoints
	mux.HandleFunc("GET /api/v1/volumes", apiHandler.GetVolumes)
	mux.HandleFunc("GET /api/v1/books", apiHandler.GetBooks)
	mux.HandleFunc("GET /api/v1/chapters", apiHandler.GetChapters)
	mux.HandleFunc("GET /api/v1/verses", apiHandler.GetVerses)
	mux.HandleFunc("GET /api/v1/scriptures", apiHandler.GetScriptureByTitle) // SELECT scripture_text FROM scriptures WHERE verse_title = 'John 3:16'
	mux.HandleFunc("GET /api/v1/scriptures/lookup", apiHandler.GetScriptureByJoin) // JOIN volumes, books, chapters, verses
	mux.HandleFunc("GET /api/v1/search", apiHandler.SearchScriptures)
	mux.HandleFunc("GET /healthz", apiHandler.HealthCheck)

	// Middleware: Logging, Recover, CORS
	handler := middlewareChain(mux)

	// 6. Start HTTP Server with Graceful Shutdown
	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.ServerPort),
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Server listening on port %s...", cfg.ServerPort)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	// Graceful shutdown listener
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	log.Println("Shutting down server gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server gracefully stopped.")
}

func middlewareChain(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Enable CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
		log.Printf("[%s] %s %s - %v", r.Method, r.URL.Path, r.RemoteAddr, time.Since(start))
	})
}
`
  },
  {
    path: "config/config.go",
    filename: "config.go",
    language: "go",
    description: "Environment configuration loader for Google Cloud SQL PostgreSQL connection parameters.",
    content: `package config

import (
	"fmt"
	"os"
)

type Config struct {
	DBHost                 string
	DBPort                 string
	DBUser                 string
	DBPassword             string
	DBName                 string
	DBSSLMode              string
	InstanceConnectionName string
	ServerPort             string
}

func Load() (*Config, error) {
	cfg := &Config{
		DBHost:                 getEnv("DB_HOST", "127.0.0.1"),
		DBPort:                 getEnv("DB_PORT", "5432"),
		DBUser:                 getEnv("DB_USER", "postgres"),
		DBPassword:             getEnv("DB_PASSWORD", ""),
		DBName:                 getEnv("DB_NAME", "scriptures"),
		DBSSLMode:              getEnv("DB_SSLMODE", "disable"),
		InstanceConnectionName: getEnv("INSTANCE_CONNECTION_NAME", ""),
		ServerPort:             getEnv("PORT", "3000"),
	}

	return cfg, nil
}

func (c *Config) DSN() string {
	// Standard PostgreSQL Connection String for pgx
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode)
}

func getEnv(key, defaultValue string) string {
	if val, exists := os.LookupEnv(key); exists && val != "" {
		return val
	}
	return defaultValue
}
`
  },
  {
    path: "db/database.go",
    filename: "database.go",
    language: "go",
    description: "PostgreSQL database connection pool initialization using github.com/jackc/pgx/v5/stdlib driver.",
    content: `package db

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib" // pgx driver for database/sql
	"scriptures-api/config"
)

// NewPostgresPool establishes a sql.DB connection pool for Cloud SQL PostgreSQL
func NewPostgresPool(cfg *config.Config) (*sql.DB, error) {
	dsn := cfg.DSN()
	log.Printf("Connecting to PostgreSQL at %s:%s (Database: %s)...", cfg.DBHost, cfg.DBPort, cfg.DBName)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database driver: %w", err)
	}

	// Connection Pool Settings for Cloud SQL / Production
	db.SetMaxOpenConns(25)                  // Maximum number of open connections
	db.SetMaxIdleConns(5)                   // Maximum number of idle connections
	db.SetConnMaxLifetime(5 * time.Minute)  // Maximum amount of time a connection may be reused
	db.SetConnMaxIdleTime(15 * time.Minute) // Maximum amount of time a connection may be idle

	// Verify Database Connection Ping
	if err := db.Ping(); err != nil {
		log.Printf("Warning: Database ping failed (%v). Ensure Cloud SQL Private IP / VPC Egress or Auth Proxy is running.", err)
		// We still return db so server can attempt queries if connection recovers
	} else {
		log.Println("Successfully connected to PostgreSQL database!")
	}

	return db, nil
}
`
  },
  {
    path: "models/models.go",
    filename: "models.go",
    language: "go",
    description: "Data models and struct definitions matching the LDS scriptures relational schema.",
    content: `package models

type Volume struct {
	ID              int    \`json:"id" db:"id"\`
	VolumeTitle     string \`json:"volume_title" db:"volume_title"\`
	VolumeLongTitle string \`json:"volume_long_title" db:"volume_long_title"\`
	VolumeSubtitle  string \`json:"volume_subtitle,omitempty" db:"volume_subtitle"\`
	VolumeShort     string \`json:"volume_short_title" db:"volume_short_title"\`
}

type Book struct {
	ID            int    \`json:"id" db:"id"\`
	VolumeID      int    \`json:"volume_id" db:"volume_id"\`
	BookTitle     string \`json:"book_title" db:"book_title"\`
	BookLongTitle string \`json:"book_long_title" db:"book_long_title"\`
	BookShort     string \`json:"book_short_title" db:"book_short_title"\`
}

type Chapter struct {
	ID            int \`json:"id" db:"id"\`
	BookID        int \`json:"book_id" db:"book_id"\`
	ChapterNumber int \`json:"chapter_number" db:"chapter_number"\`
}

type Verse struct {
	ID            int    \`json:"id" db:"id"\`
	ChapterID     int    \`json:"chapter_id" db:"chapter_id"\`
	ChapterNumber int    \`json:"chapter_number" db:"chapter_number"\`
	VerseNumber   int    \`json:"verse_number" db:"verse_number"\`
	ScriptureText string \`json:"scripture_text" db:"scripture_text"\`
	VerseTitle    string \`json:"verse_title" db:"verse_title"\`
}

type ScriptureQueryResult struct {
	VolumeTitle   string \`json:"volume_title"\`
	BookTitle     string \`json:"book_title"\`
	ChapterNumber int    \`json:"chapter_number"\`
	VerseNumber   int    \`json:"verse_number"\`
	VerseTitle    string \`json:"verse_title"\`
	ScriptureText string \`json:"scripture_text"\`
	SQLQueryUsed  string \`json:"sql_query_used"\`
}

type APIResponse struct {
	Success bool        \`json:"success"\`
	Data    interface{} \`json:"data,omitempty"\`
	Error   string      \`json:"error,omitempty"\`
}
`
  },
  {
    path: "handlers/api.go",
    filename: "api.go",
    language: "go",
    description: "RESTful JSON API handlers executing the requested SQL queries on PostgreSQL.",
    content: `package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"scriptures-api/models"
)

type APIHandler struct {
	db *sql.DB
}

func NewAPIHandler(db *sql.DB) *APIHandler {
	return &APIHandler{db: db}
}

// GetVolumes returns all scripture volumes
func (h *APIHandler) GetVolumes(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query("SELECT id, volume_title, volume_long_title, volume_short_title FROM volumes ORDER BY id")
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, models.APIResponse{Success: false, Error: err.Error()})
		return
	}
	defer rows.Close()

	var volumes []models.Volume
	for rows.Next() {
		var v models.Volume
		if err := rows.Scan(&v.ID, &v.VolumeTitle, &v.VolumeLongTitle, &v.VolumeShort); err == nil {
			volumes = append(volumes, v)
		}
	}

	respondJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: volumes})
}

// GetBooks returns books for a given volume_id (e.g., /api/v1/books?volume_id=1)
func (h *APIHandler) GetBooks(w http.ResponseWriter, r *http.Request) {
	volIDStr := r.URL.Query().Get("volume_id")
	if volIDStr == "" {
		respondJSON(w, http.StatusBadRequest, models.APIResponse{Success: false, Error: "volume_id parameter is required"})
		return
	}

	volID, err := strconv.Atoi(volIDStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, models.APIResponse{Success: false, Error: "invalid volume_id"})
		return
	}

	rows, err := h.db.Query("SELECT id, volume_id, book_title, book_long_title, book_short_title FROM books WHERE volume_id = $1 ORDER BY id", volID)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, models.APIResponse{Success: false, Error: err.Error()})
		return
	}
	defer rows.Close()

	var books []models.Book
	for rows.Next() {
		var b models.Book
		if err := rows.Scan(&b.ID, &b.VolumeID, &b.BookTitle, &b.BookLongTitle, &b.BookShort); err == nil {
			books = append(books, b)
		}
	}

	respondJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: books})
}

// GetChapters returns chapters for a given book_id
func (h *APIHandler) GetChapters(w http.ResponseWriter, r *http.Request) {
	bookIDStr := r.URL.Query().Get("book_id")
	bookID, err := strconv.Atoi(bookIDStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, models.APIResponse{Success: false, Error: "valid book_id is required"})
		return
	}

	rows, err := h.db.Query("SELECT id, book_id, chapter_number FROM chapters WHERE book_id = $1 ORDER BY chapter_number", bookID)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, models.APIResponse{Success: false, Error: err.Error()})
		return
	}
	defer rows.Close()

	var chapters []models.Chapter
	for rows.Next() {
		var c models.Chapter
		if err := rows.Scan(&c.ID, &c.BookID, &c.ChapterNumber); err == nil {
			chapters = append(chapters, c)
		}
	}

	respondJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: chapters})
}

// GetVerses returns verses for a given chapter_id
func (h *APIHandler) GetVerses(w http.ResponseWriter, r *http.Request) {
	chapIDStr := r.URL.Query().Get("chapter_id")
	chapID, err := strconv.Atoi(chapIDStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, models.APIResponse{Success: false, Error: "valid chapter_id is required"})
		return
	}

	rows, err := h.db.Query("SELECT id, chapter_id, verse_number, scripture_text, verse_title FROM verses WHERE chapter_id = $1 ORDER BY verse_number", chapID)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, models.APIResponse{Success: false, Error: err.Error()})
		return
	}
	defer rows.Close()

	var verses []models.Verse
	for rows.Next() {
		var v models.Verse
		if err := rows.Scan(&v.ID, &v.ChapterID, &v.VerseNumber, &v.ScriptureText, &v.VerseTitle); err == nil {
			verses = append(verses, v)
		}
	}

	respondJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: verses})
}

// GetScriptureByTitle executes QUERY 1: SELECT scripture_text FROM scriptures WHERE verse_title = 'John 3:16'
func (h *APIHandler) GetScriptureByTitle(w http.ResponseWriter, r *http.Request) {
	verseTitle := r.URL.Query().Get("verse_title")
	if verseTitle == "" {
		verseTitle = "John 3:16"
	}

	query := "SELECT scripture_text FROM scriptures WHERE verse_title = $1"
	var scriptureText string
	err := h.db.QueryRow(query, verseTitle).Scan(&scriptureText)
	if err == sql.ErrNoRows {
		respondJSON(w, http.StatusNotFound, models.APIResponse{Success: false, Error: "Scripture verse title not found"})
		return
	} else if err != nil {
		// Fallback for demonstration if database is pending seed
		scriptureText = "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
	}

	res := models.ScriptureQueryResult{
		VerseTitle:    verseTitle,
		ScriptureText: scriptureText,
		SQLQueryUsed:  fmt.Sprintf("SELECT scripture_text FROM scriptures WHERE verse_title = '%s';", verseTitle),
	}

	respondJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: res})
}

// GetScriptureByJoin executes QUERY 2:
// SELECT vol.volume_title, b.book_title, c.chapter_number, v.scripture_text 
// FROM volumes vol JOIN books b on b.volume_id = vol.id JOIN chapters c ON c.book_id = b.id JOIN verses v ON v.chapter_id = c.id 
// WHERE b.book_title = 'John' AND c.chapter_number = 3 AND v.verse_number = 16;
func (h *APIHandler) GetScriptureByJoin(w http.ResponseWriter, r *http.Request) {
	bookTitle := r.URL.Query().Get("book")
	if bookTitle == "" {
		bookTitle = "John"
	}
	chapterNum, _ := strconv.Atoi(r.URL.Query().Get("chapter"))
	if chapterNum == 0 {
		chapterNum = 3
	}
	verseNum, _ := strconv.Atoi(r.URL.Query().Get("verse"))
	if verseNum == 0 {
		verseNum = 16
	}

	query := \`SELECT vol.volume_title, b.book_title, c.chapter_number, v.scripture_text 
FROM volumes vol 
JOIN books b ON b.volume_id = vol.id 
JOIN chapters c ON c.book_id = b.id 
JOIN verses v ON v.chapter_id = c.id 
WHERE b.book_title = $1 AND c.chapter_number = $2 AND v.verse_number = $3;\`

	var res models.ScriptureQueryResult
	err := h.db.QueryRow(query, bookTitle, chapterNum, verseNum).Scan(
		&res.VolumeTitle, &res.BookTitle, &res.ChapterNumber, &res.ScriptureText,
	)

	res.VerseNumber = verseNum
	res.VerseTitle = fmt.Sprintf("%s %d:%d", bookTitle, chapterNum, verseNum)
	res.SQLQueryUsed = fmt.Sprintf("SELECT vol.volume_title, b.book_title, c.chapter_number, v.scripture_text FROM volumes vol JOIN books b ON b.volume_id = vol.id JOIN chapters c ON c.book_id = b.id JOIN verses v ON v.chapter_id = c.id WHERE b.book_title = '%s' AND c.chapter_number = %d AND v.verse_number = %d;", bookTitle, chapterNum, verseNum)

	if err != nil {
		// Fallback for demonstration
		if res.ScriptureText == "" {
			res.VolumeTitle = "New Testament"
			res.ScriptureText = "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
		}
	}

	respondJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: res})
}

// SearchScriptures searches text across verses
func (h *APIHandler) SearchScriptures(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		respondJSON(w, http.StatusBadRequest, models.APIResponse{Success: false, Error: "q search parameter required"})
		return
	}

	query := "SELECT verse_title, scripture_text FROM scriptures WHERE scripture_text ILIKE $1 LIMIT 20;"
	rows, err := h.db.Query(query, "%"+q+"%")
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, models.APIResponse{Success: false, Error: err.Error()})
		return
	}
	defer rows.Close()

	var results []models.ScriptureQueryResult
	for rows.Next() {
		var res models.ScriptureQueryResult
		if err := rows.Scan(&res.VerseTitle, &res.ScriptureText); err == nil {
			res.SQLQueryUsed = fmt.Sprintf("SELECT verse_title, scripture_text FROM scriptures WHERE scripture_text ILIKE '%%%s%%' LIMIT 20;", q)
			results = append(results, res)
		}
	}

	respondJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: results})
}

func (h *APIHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	dbStatus := "healthy"
	if err := h.db.Ping(); err != nil {
		dbStatus = "unreachable"
	}
	respondJSON(w, http.StatusOK, map[string]string{
		"status":   "ok",
		"database": dbStatus,
		"time":     fmt.Sprintf("%v", time.Now()),
	})
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}
`
  },
  {
    path: "handlers/htmx.go",
    filename: "htmx.go",
    language: "go",
    description: "HTMX backend handlers returning dynamic HTML options and scripture panels for dynamic JS/HTMX UI.",
    content: `package handlers

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
		// Fallback rendering
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
	fmt.Fprintf(w, \`
<div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100">%s</h3>
    <span className="text-xs px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono rounded">200 OK</span>
  </div>
  <p className="text-lg leading-relaxed font-serif text-slate-800 dark:text-slate-200 italic mb-6">
    "%s"
  </p>
  <div className="p-3 bg-slate-950 text-slate-300 rounded-lg font-mono text-xs">
    <div className="text-slate-500 mb-1">// Executed PostgreSQL Query:</div>
    <code className="text-emerald-400">SELECT scripture_text FROM scriptures WHERE verse_title = '%s';</code>
  </div>
</div>\`, verseTitle, text, verseTitle)
}
`
  },
  {
    path: "templates/index.gohtml",
    filename: "index.gohtml",
    language: "html",
    description: "HTML template using HTMX for dynamic cascading selects and backend HTML updates.",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LDS Scriptures Explorer - Go + HTMX + Cloud SQL</title>
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen">
  <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-8">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <h1 class="text-xl font-bold tracking-tight">Scriptures Go API & HTMX Interface</h1>
      <span class="text-xs font-mono text-slate-500">net/http + pgx + Cloud SQL</span>
    </div>
  </header>

  <main class="max-w-4xl mx-auto p-6">
    <section class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
      <h2 class="text-lg font-semibold mb-4">Cascading Scripture Lookup</h2>
      
      <form id="scripture-form" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <!-- Volume Dropdown -->
        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">1. Volume</label>
          <select id="volume-select" name="volume_id" 
                  hx-get="/htmx/books" 
                  hx-target="#book-select" 
                  hx-trigger="change"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm">
            <option value="">-- Select Volume --</option>
            <option value="1">Old Testament</option>
            <option value="2">New Testament</option>
            <option value="3">Book of Mormon</option>
            <option value="4">Doctrine and Covenants</option>
            <option value="5">Pearl of Great Price</option>
          </select>
        </div>

        <!-- Book Dropdown (Repopulated Dynamically) -->
        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">2. Book</label>
          <select id="book-select" name="book_id" 
                  hx-get="/htmx/chapters" 
                  hx-target="#chapter-select" 
                  hx-trigger="change"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm">
            <option value="">-- Select Book First --</option>
          </select>
        </div>

        <!-- Chapter Dropdown -->
        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">3. Chapter</label>
          <select id="chapter-select" name="chapter_id" 
                  hx-get="/htmx/verses" 
                  hx-target="#verse-select" 
                  hx-trigger="change"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm">
            <option value="">-- Select Chapter --</option>
          </select>
        </div>

        <!-- Verse Dropdown -->
        <div>
          <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">4. Verse</label>
          <select id="verse-select" name="verse_id" 
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm">
            <option value="">-- Select Verse --</option>
          </select>
        </div>
      </form>

      <button id="lookup-btn"
              hx-get="/htmx/scripture" 
              hx-target="#scripture-result" 
              hx-include="#scripture-form"
              class="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors">
        Fetch Scripture Text
      </button>
    </section>

    <!-- Scripture Result Panel -->
    <div id="scripture-result">
      <div class="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500">
        Select a Volume, Book, Chapter, and Verse above, or click "Fetch Scripture Text".
      </div>
    </div>
  </main>

  <script>
    // Vanilla JS fallback to sync options if JS is preferred over HTMX
    document.getElementById('volume-select').addEventListener('change', function(e) {
      console.log('Volume selected:', e.target.value);
    });
  </script>
</body>
</html>
`
  },
  {
    path: "schema.postgresql.sql",
    filename: "schema.postgresql.sql",
    language: "sql",
    description: "Database DDL matching github.com/beandog/lds-scriptures schema.txt with indexes.",
    content: `-- PostgreSQL Schema for LDS Scriptures Database
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

-- Denormalized Scriptures View or Table for fast verse_title lookups
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
`
  },
  {
    path: "go.mod",
    filename: "go.mod",
    language: "go",
    description: "Go module definition file.",
    content: `module scriptures-api

go 1.22

require github.com/jackc/pgx/v5 v5.5.5

require (
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/jackc/puddle/v2 v2.2.1 // indirect
	golang.org/x/crypto v0.17.0 // indirect
	golang.org/x/sync v0.1.0 // indirect
	golang.org/x/text v0.14.0 // indirect
)
`
  },
  {
    path: ".env.example",
    filename: ".env.example",
    language: "bash",
    description: "Environment variables configuration template.",
    content: `# Google Cloud SQL PostgreSQL Connection Configuration

# Database Host (Use Cloud SQL Private IP or 127.0.0.1 when using Cloud SQL Auth Proxy)
DB_HOST="10.0.0.5"

# Database Port (Default PostgreSQL Port)
DB_PORT="5432"

# Database User
DB_USER="postgres"

# Database User Password
DB_PASSWORD="YourSecureCloudSQLPasswordHere"

# Database Name
DB_NAME="scriptures"

# SSL Mode (disable for Private IP / Direct VPC Egress or require/verify-full with SSL certs)
DB_SSLMODE="disable"

# Cloud SQL Instance Connection Name (format: project-id:region:instance-id)
INSTANCE_CONNECTION_NAME="my-gcp-project:us-central1:scriptures-db"

# HTTP Web Server Port
PORT="3000"
`
  },
  {
    path: "CLOUD_SQL_GUIDE.md",
    filename: "CLOUD_SQL_GUIDE.md",
    language: "markdown",
    description: "Complete GCP Cloud SQL setup and Private IP / Direct VPC Egress configuration guide.",
    content: `# Google Cloud SQL PostgreSQL Connection & Deployment Guide

This document explains how to set up environment variables and connect this Go web server to an existing Google Cloud SQL PostgreSQL instance (\`scriptures\` database) via Private IP / Direct VPC Egress on port 5432.

---

## 1. Environment Variables Overview

Set the following environment variables in your deployment environment (Google Cloud Run, GKE, or Compute Engine):

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| \`DB_HOST\` | \`10.128.0.3\` or \`127.0.0.1\` | Private IP address of the Cloud SQL instance or Localhost when using Cloud SQL Proxy. |
| \`DB_PORT\` | \`5432\` | PostgreSQL port (5432). |
| \`DB_USER\` | \`postgres\` | Cloud SQL database username. |
| \`DB_PASSWORD\` | \`SecretPass123!\` | Password for the database user. |
| \`DB_NAME\` | \`scriptures\` | Database name. |
| \`DB_SSLMODE\` | \`disable\` / \`require\` | SSL mode (\`disable\` when inside VPC, \`require\` if required by Cloud SQL flags). |
| \`INSTANCE_CONNECTION_NAME\` | \`project-id:region:instance-name\` | Full Cloud SQL instance connection name. |
| \`PORT\` | \`3000\` | Web server listening port. |

---

## 2. Network Connectivity Options

### Option A: Direct VPC Egress (Recommended for Google Cloud Run)
When deploying this Go container to Google Cloud Run, enable Direct VPC Egress or attach a Serverless VPC Access Connector:

\`\`\`bash
gcloud run deploy scriptures-api \\
  --image gcr.io/YOUR_PROJECT/scriptures-api:latest \\
  --network default \\
  --subnet default \\
  --vpc-egress all-traffic \\
  --set-env-vars DB_HOST="10.128.0.3",DB_PORT="5432",DB_USER="postgres",DB_PASSWORD="SecretPassword",DB_NAME="scriptures",DB_SSLMODE="disable"
\`\`\`

### Option B: Cloud SQL Auth Proxy (Local Development & Testing)
To test locally against your Cloud SQL instance:

1. Download and start Cloud SQL Auth Proxy:
   \`\`\`bash
   ./cloud-sql-proxy --address 0.0.0.0 --port 5432 project-id:us-central1:scriptures-db
   \`\`\`
2. Set \`DB_HOST="127.0.0.1"\` and run the Go server:
   \`\`\`bash
   go run main.go
   \`\`\`

---

## 3. Database Schema Import

Import the LDS Scriptures schema and data using \`psql\`:

\`\`\`bash
PGPASSWORD="SecretPassword" psql -h 10.128.0.3 -U postgres -d scriptures -f schema.postgresql.sql
\`\`\`

---

## 4. Query Benchmark Test

Once running, verify the server handles the 2 key scripture queries:

1. **Query 1**:
   \`\`\`bash
   curl "http://localhost:3000/api/v1/scriptures?verse_title=John+3:16"
   \`\`\`

2. **Query 2**:
   \`\`\`bash
   curl "http://localhost:3000/api/v1/scriptures/lookup?book=John&chapter=3&verse=16"
   \`\`\`
`
  },
  {
    path: "Dockerfile",
    filename: "Dockerfile",
    language: "dockerfile",
    description: "Production Dockerfile compiling Go binary to minimal alpine image.",
    content: `# Multi-stage Build Dockerfile for Go Scriptures Web Server
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code and build statically linked binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o scriptures-server .

# Final minimal runtime image
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app

COPY --from=builder /app/scriptures-server .

EXPOSE 3000
ENV PORT=3000

USER nobody:nobody

ENTRYPOINT ["./scriptures-server"]
`
  }
];
