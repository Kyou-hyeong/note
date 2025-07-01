package routes

import (
	"database/sql"
	// "net/http"

	"firebase-note/backend/handlers"

	"github.com/gorilla/mux"
)

func RegisterRoutes(db *sql.DB) *mux.Router {
	r := mux.NewRouter()

	// r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
	// 	w.Write([]byte("ok"))
	// })
	r.HandleFunc("/api/canvas/save", handlers.SaveCanvas(db)).Methods("POST")
	r.HandleFunc("/api/canvas/load", handlers.LoadCanvas(db)).Methods("GET")

	return r
}
