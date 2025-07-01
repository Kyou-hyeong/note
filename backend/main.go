package main

import (
	"log"
	"net/http"

	"firebase-note/backend/db"
	"firebase-note/backend/routes"

	"github.com/gorilla/handlers"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	database := db.Connect()
	defer database.Close()

	r := routes.RegisterRoutes(database)

	log.Println("Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handlers.CORS(
		handlers.AllowedOrigins([]string{
			"https://5173-firebase-note-1751078190988.cluster-6dx7corvpngoivimwvvljgokdw.cloudworkstations.dev",
			"http://localhost:5173",
			"http://localhost:9000",
			"https://9000-firebase-note-1751078190988.cluster-6dx7corvpngoivimwvvljgokdw.cloudworkstations.dev",
		}),
		handlers.AllowedMethods([]string{"GET", "POST", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type"}),
	)(r)))
}
