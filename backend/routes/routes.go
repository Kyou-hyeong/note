package routes

import (
	"database/sql"
	// "net/http"

	"backend/handlers"

	"github.com/gorilla/mux"
)

func RegisterRoutes(db *sql.DB) *mux.Router {
	r := mux.NewRouter()

	r.HandleFunc("/api/canvas/save", handlers.SaveCanvas(db)).Methods("POST")
	r.HandleFunc("/api/canvas/load", handlers.LoadCanvas(db)).Methods("GET")

	return r
}
