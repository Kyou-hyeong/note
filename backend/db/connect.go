package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
	"github.com/joho/godotenv"

)

func Connect() *sql.DB {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("❌ .env 파일을 불러올 수 없습니다:", err)
	}

	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("❌ DB 연결 실패:", err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal("❌ DB 응답 실패:", err)
	}

	log.Println("✅ DB 연결 성공")
	return db
}
