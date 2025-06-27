package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	// 핸들러 함수 등록
	http.HandleFunc("/hello", helloHandler)

	// 서버 시작 (포트 8080)
	fmt.Println("Server starting on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// helloHandler는 /hello 경로 요청을 처리합니다.
func helloHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, Go Backend!")
}
