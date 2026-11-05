package main

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
	mux.HandleFunc("GET /api/v1/scriptures", apiHandler.GetScriptureByTitle)       // QUERY 1: SELECT scripture_text FROM scriptures WHERE verse_title = 'John 3:16'
	mux.HandleFunc("GET /api/v1/scriptures/lookup", apiHandler.GetScriptureByJoin) // QUERY 2: JOIN volumes, books, chapters, verses
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
