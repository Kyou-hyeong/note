package routes

import (
	"database/sql"

	"firebase-note/backend/handlers"

	"github.com/gorilla/mux"
)

func RegisterRoutes(db *sql.DB) *mux.Router {
	r := mux.NewRouter()
	r.HandleFunc("/api/canvas/save", handlers.SaveCanvas(db)).Methods("POST")
	r.HandleFunc("/api/canvas/load", handlers.LoadCanvas(db)).Methods("GET")
	r.HandleFunc("/api/upload", handlers.UploadImageHandler).Methods("POST")

	return r
}
