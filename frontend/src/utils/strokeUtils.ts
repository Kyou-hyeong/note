// import type { StrokePoint } from "perfect-freehand";

export function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return "";

  const d = stroke.map((point, i) => {
    const [x, y] = point as [number, number];
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return d.join(" ");
}


