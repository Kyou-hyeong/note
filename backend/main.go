// main.go
package main

import (
	"log"
	"net/http"
	// "os"

	"backend/db"
	"backend/routes"
	"github.com/gorilla/handlers"
)

func main() {
	database := db.Connect()
	defer database.Close()

	r := routes.RegisterRoutes(database)

	log.Println("Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}), // 또는 "http://localhost:8080" 명시
		handlers.AllowedMethods([]string{"GET", "POST", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type"}),
	)(r)))
}
