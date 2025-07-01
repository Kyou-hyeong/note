package models

type Point struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type Line struct {
	ID	   int     `json:"id"`
	Points []Point `json:"points"`
}

type Image struct {
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
	URL    string  `json:"url"`
}

type TextBox struct {
	X       float64 `json:"x"`
	Y       float64 `json:"y"`
	Content string  `json:"content"`
}

type Payload struct {
	Lines   []Line   `json:"lines"`
	Images  []Image  `json:"images"`
	TextBoxes []TextBox `json:"textBoxes"`
}