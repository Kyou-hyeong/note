package handlers
import (
	"database/sql"
	"encoding/json"
	"net/http"

	"backend/models"

)

// SaveCanvas 핸들러: 프론트에서 보낸 데이터를 DB에 저장
func SaveCanvas(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			Lines     []models.Line     `json:"lines"`
			Images    []models.Image    `json:"images"`
			TextBoxes []models.TextBox  `json:"textBoxes"`
		}

		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "잘못된 요청 데이터", http.StatusBadRequest)
			return
		}

		tx, err := db.Begin()
		if err != nil {
			http.Error(w, "DB 트랜잭션 시작 실패", 500)
			return
		}
		defer tx.Rollback()

		// 선 저장
		for _, line := range payload.Lines {
			var lineID int
			err := tx.QueryRow("INSERT INTO lines DEFAULT VALUES RETURNING id").Scan(&lineID)
			if err != nil {
				http.Error(w, "선 저장 실패", 500)
				return
			}
			for _, pt := range line.Points {
				_, err := tx.Exec("INSERT INTO points (line_id, x, y) VALUES ($1, $2, $3)", lineID, pt.X, pt.Y)
				if err != nil {
					http.Error(w, "점 저장 실패", 500)
					return
				}
			}
		}

		// 이미지 저장
		for _, img := range payload.Images {
			_, err := tx.Exec(
				"INSERT INTO images (x, y, width, height, image_url) VALUES ($1, $2, $3, $4, $5)",
				img.X, img.Y, img.Width, img.Height, img.URL,
			)
			if err != nil {
				http.Error(w, "이미지 저장 실패", 500)
				return
			}
		}

		// 텍스트 박스 저장
		for _, tb := range payload.TextBoxes {
			_, err := tx.Exec(
				"INSERT INTO text_boxes (x, y, content) VALUES ($1, $2, $3)",
				tb.X, tb.Y, tb.Content,
			)
			if err != nil {
				http.Error(w, "텍스트 박스 저장 실패", 500)
				return
			}
		}

		if err := tx.Commit(); err != nil {
			http.Error(w, "트랜잭션 커밋 실패", 500)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// LoadCanvas 핸들러: DB에 저장된 데이터를 읽어 프론트로 전송
func LoadCanvas(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var result struct {
			Lines     []models.Line     `json:"lines"`
			Images    []models.Image    `json:"images"`
			TextBoxes []models.TextBox  `json:"textBoxes"`
		}

		// 선 및 점 로드
		lineRows, err := db.Query("SELECT id FROM lines")
		if err != nil {
			http.Error(w, "선 로드 실패", 500)
			return
		}
		defer lineRows.Close()

		for lineRows.Next() {
			var line models.Line
			if err := lineRows.Scan(&line.ID); err != nil {
				http.Error(w, "선 스캔 실패", 500)
				return
			}
			pointRows, err := db.Query("SELECT x, y FROM points WHERE line_id = $1", line.ID)
			if err != nil {
				http.Error(w, "점 로드 실패", 500)
				return
			}
			defer pointRows.Close()

			for pointRows.Next() {
				var pt models.Point
				if err := pointRows.Scan(&pt.X, &pt.Y); err != nil {
					http.Error(w, "점 스캔 실패", 500)
					return
				}
				line.Points = append(line.Points, pt)
			}
			result.Lines = append(result.Lines, line)
		}

		// 이미지 로드
		imgRows, err := db.Query("SELECT x, y, width, height, image_url FROM images")
		if err != nil {
			http.Error(w, "이미지 로드 실패", 500)
			return
		}
		defer imgRows.Close()

		for imgRows.Next() {
			var img models.Image
			if err := imgRows.Scan(&img.X, &img.Y, &img.Width, &img.Height, &img.URL); err != nil {
				http.Error(w, "이미지 스캔 실패", 500)
				return
			}
			result.Images = append(result.Images, img)
		}

		// 텍스트 박스 로드
		tbRows, err := db.Query("SELECT x, y, content FROM text_boxes")
		if err != nil {
			http.Error(w, "텍스트 박스 로드 실패", 500)
			return
		}
		defer tbRows.Close()

		for tbRows.Next() {
			var tb models.TextBox
			if err := tbRows.Scan(&tb.X, &tb.Y, &tb.Content); err != nil {
				http.Error(w, "텍스트 스캔 실패", 500)
				return
			}
			result.TextBoxes = append(result.TextBoxes, tb)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
	}
}