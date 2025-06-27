package handlers

import (
	"database/sql"
	"encoding/json"
	"io/ioutil"
	"net/http"

	"main/models"
)

func SaveCanvas(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var data models.CanvasData
		body, _ := ioutil.ReadAll(r.Body)
		json.Unmarshal(body, &data)

		_, err := db.Exec(
			`INSERT INTO canvas (lines, images, texts) VALUES ($1, $2, $3)`,
			data.Lines, data.Images, data.Texts,
		)
		if err != nil {
			http.Error(w, "Failed to insert", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
	}
}

func LoadCanvas(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		row := db.QueryRow(`SELECT id, lines, images, texts FROM canvas ORDER BY id DESC LIMIT 1`)

		var data models.CanvasData
		err := row.Scan(&data.ID, &data.Lines, &data.Images, &data.Texts)
		if err != nil {
			http.Error(w, "No data found", http.StatusNotFound)
			return
		}

		json.NewEncoder(w).Encode(data)
	}
}
