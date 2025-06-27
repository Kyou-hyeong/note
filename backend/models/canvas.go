package models

type CanvasData struct {
	ID     int      `json:"id"`
	Lines  []string `json:"lines"`  // JSON string
	Images []string `json:"images"` // JSON string
	Texts  []string `json:"texts"`  // JSON string
}
