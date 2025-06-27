package main

import (
	"log"
	"net/http"

	"main/db"
	"main/handlers"

	"github.com/gorilla/mux"
)

func main() {
	database := db.Connect()
	defer database.Close()

	r := mux.NewRouter()

	r.HandleFunc("/api/canvas/save", handlers.SaveCanvas(database)).Methods("POST")
	r.HandleFunc("/api/canvas/load", handlers.LoadCanvas(database)).Methods("GET")

	log.Println("Server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
