package models

type Volume struct {
	ID              int    `json:"id" db:"id"`
	VolumeTitle     string `json:"volume_title" db:"volume_title"`
	VolumeLongTitle string `json:"volume_long_title" db:"volume_long_title"`
	VolumeSubtitle  string `json:"volume_subtitle,omitempty" db:"volume_subtitle"`
	VolumeShort     string `json:"volume_short_title" db:"volume_short_title"`
}

type Book struct {
	ID            int    `json:"id" db:"id"`
	VolumeID      int    `json:"volume_id" db:"volume_id"`
	BookTitle     string `json:"book_title" db:"book_title"`
	BookLongTitle string `json:"book_long_title" db:"book_long_title"`
	BookShort     string `json:"book_short_title" db:"book_short_title"`
}

type Chapter struct {
	ID            int `json:"id" db:"id"`
	BookID        int `json:"book_id" db:"book_id"`
	ChapterNumber int `json:"chapter_number" db:"chapter_number"`
}

type Verse struct {
	ID            int    `json:"id" db:"id"`
	ChapterID     int    `json:"chapter_id" db:"chapter_id"`
	ChapterNumber int    `json:"chapter_number" db:"chapter_number"`
	VerseNumber   int    `json:"verse_number" db:"verse_number"`
	ScriptureText string `json:"scripture_text" db:"scripture_text"`
	VerseTitle    string `json:"verse_title" db:"verse_title"`
}

type ScriptureQueryResult struct {
	VolumeTitle   string `json:"volume_title"`
	BookTitle     string `json:"book_title"`
	ChapterNumber int    `json:"chapter_number"`
	VerseNumber   int    `json:"verse_number"`
	VerseTitle    string `json:"verse_title"`
	ScriptureText string `json:"scripture_text"`
	SQLQueryUsed  string `json:"sql_query_used"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
