import { useState, useRef, useCallback } from 'react';
import type { Point, LineElement, ToolType, CanvasElementStatus } from '../types';
import { v4 as uuidv4 } from 'uuid'; 

type GetCanvasCoords = (e: React.PointerEvent | MouseEvent) => Point;

export const useDrawing = (getCanvasCoords: GetCanvasCoords, tool: ToolType) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnLines, setDrawnLines] = useState<LineElement[]>([]);
  const currentLine = useRef<Point[]>([]); // 현재 그리고 있는 선의 점들

  // 지우기 기능 (마우스 주변 일정 거리의 선 삭제)
  const eraseAtPointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const threshold = 10;
    setDrawnLines(prev => {
      // 필터링하여 'deleted'로 마크하거나 완전히 제거 (나중에 deleted 상태로 변경하는 것이 필요)
      const updatedLines = prev.filter(line => {
        // 선의 어떤 점이든 마우스 위치 근처에 있으면 해당 선 삭제
        return !line.points.some(pt => Math.hypot(pt.x - x, pt.y - y) < threshold);
      });
      // 현재는 UI에서만 제거되므로, DB 동기화를 위해 deleted status 부여 로직 필요
      updatedLines.forEach(line => {
        if (line.status !== 'deleted') {
          line.status = 'deleted';
        }
      });
      return updatedLines;
    });
  }, [getCanvasCoords]);

  // 이 훅에서 handlePointerDown, handlePointerMove의 펜/지우개 관련 로직을 처리하도록 확장 가능
  // 현재는 index.tsx에서 일부 상태를 받아와 처리.

  return {
    isDrawing,
    setIsDrawing,
    drawnLines,
    setDrawnLines,
    currentLine,
    eraseAtPointer,
  };
};