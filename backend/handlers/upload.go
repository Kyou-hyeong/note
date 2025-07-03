// package handlers

// import (
// 	"fmt"
// 	"io"
// 	"net/http"
// 	"os"
// 	"path/filepath"
// )

// func UploadImageHandler(w http.ResponseWriter, r *http.Request) {
// 	// POST 요청만 허용
// 	if r.Method != "POST" {
// 		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
// 		return
// 	}

// 	// form 데이터 파싱
// 	err := r.ParseMultipartForm(10 << 20) // 최대 10MB
// 	if err != nil {
// 		http.Error(w, "Could not parse multipart form", http.StatusBadRequest)
// 		return
// 	}

// 	// 파일 가져오기
// 	file, handler, err := r.FormFile("image")
// 	if err != nil {
// 		http.Error(w, "Could not read uploaded file", http.StatusBadRequest)
// 		return
// 	}
// 	defer file.Close()

// 	// uploads 폴더 없으면 생성
// 	if _, err := os.Stat("uploads"); os.IsNotExist(err) {
// 		os.Mkdir("uploads", os.ModePerm)
// 	}

// 	// 저장 경로 설정
// 	filename := filepath.Base(handler.Filename)
// 	dst, err := os.Create("uploads/" + filename)
// 	if err != nil {
// 		http.Error(w, "Failed to create file", http.StatusInternalServerError)
// 		return
// 	}
// 	defer dst.Close()

// 	// 파일 복사
// 	_, err = io.Copy(dst, file)
// 	if err != nil {
// 		http.Error(w, "Failed to save file", http.StatusInternalServerError)
// 		return
// 	}

// 	// 클라이언트에 이미지 URL 반환
// 	imageURL := fmt.Sprintf("/uploads/%s", filename)
// 	w.Write([]byte(imageURL))
// }

package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

func UploadImageHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	err := r.ParseMultipartForm(10 << 20) // 10MB 제한
	if err != nil {
		http.Error(w, "Could not parse multipart form", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "Could not read uploaded file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	if _, err := os.Stat("uploads"); os.IsNotExist(err) {
		os.Mkdir("uploads", os.ModePerm)
	}

	filename := filepath.Base(handler.Filename)
	dstPath := filepath.Join("uploads", filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, "Failed to create file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err = io.Copy(dst, file); err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	// ✅ JSON으로 응답
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"filename": filename,
	})
}
