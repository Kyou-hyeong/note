import React, { useRef, useState, useEffect } from 'react';
import './InfiniteCanvas.css';

type Point = { x: number; y: number };

const InfiniteCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnLines, setDrawnLines] = useState<Point[][]>([]);
  const currentLine = useRef<Point[]>([]);

  const pointers = useRef<Map<number, Point>>(new Map());
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<Point | null>(null);

  // 마우스 휠로 화면을 드래그할 때 필요한 상태
  const [isMiddleDragging, setIsMiddleDragging] = useState(false);
  const middleDragStart = useRef<Point | null>(null);

  const getCanvasCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale,
    };
  };

  const getDistance = (p1: Point, p2: Point) =>
    Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

  const getCenter = (p1: Point, p2: Point): Point => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, pos);

    // 마우스 휠 클릭으로 이동 시작
    if (e.pointerType === 'mouse' && e.button === 1) {
      setIsMiddleDragging(true);
      middleDragStart.current = pos;
      return;
    }

    // 두 손가락 터치로 확대/이동 시작
    if (pointers.current.size === 2) {
      const [p1, p2] = Array.from(pointers.current.values());
      lastTouchDistance.current = getDistance(p1, p2);
      lastTouchCenter.current = getCenter(p1, p2);
    }

    // 하나의 포인터(펜/마우스)로 선 그리기 시작
    else if (pointers.current.size === 1 && (e.pointerType === 'pen' || (e.pointerType === 'mouse'&&e.button == 0))) {
      const { x, y } = getCanvasCoords(e);
      currentLine.current = [{ x, y }];
      setIsDrawing(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = { x: e.clientX, y: e.clientY };
    if (isMiddleDragging && middleDragStart.current) {
      // 마우스 휠로 화면 이동 처리
      const dx = pos.x - middleDragStart.current.x;
      const dy = pos.y - middleDragStart.current.y;
      setOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      middleDragStart.current = pos;
      return;
    }

    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, pos);

    if (pointers.current.size === 2) {
      // 두 손가락으로 pinch + pan
      const [p1, p2] = Array.from(pointers.current.values());
      const newDistance = getDistance(p1, p2);
      const newCenter = getCenter(p1, p2);

      if (lastTouchDistance.current && lastTouchCenter.current) {
        const scaleFactor = newDistance / lastTouchDistance.current;
        setScale(prev => prev * scaleFactor);

        const dx = newCenter.x - lastTouchCenter.current.x;
        const dy = newCenter.y - lastTouchCenter.current.y;
        setOffset(prev => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));
      }

      lastTouchDistance.current = newDistance;
      lastTouchCenter.current = newCenter;
    }

    // 선 그리기 처리
    else if (isDrawing) {
      const { x, y } = getCanvasCoords(e);
      currentLine.current.push({ x, y });
      redraw();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);

    // 마우스 휠 드래그 중단
    if (isMiddleDragging && e.button === 1) {
      setIsMiddleDragging(false);
      middleDragStart.current = null;
    }

    if (pointers.current.size < 2) {
      lastTouchDistance.current = null;
      lastTouchCenter.current = null;
    }

    if (isDrawing) {
      setIsDrawing(false);
      const finishedLine = [...currentLine.current];
      currentLine.current = [];

      setDrawnLines(prev => {
        const updated = [...prev, finishedLine];
        requestAnimationFrame(() => {
          redrawWith(updated);
        });
        return updated;
      });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const scaleFactor = 1.1;
    const newScale = e.deltaY < 0 ? scale * scaleFactor : scale / scaleFactor;
    setScale(newScale);
  };

  const redrawWith = (lines: Point[][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // 저장된 선들 그리기
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    lines.forEach(line => {
      ctx.beginPath();
      line.forEach((point, idx) => {
        if (idx === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });

    // 현재 그리고 있는 선
    if (currentLine.current.length > 0) {
      ctx.beginPath();
      currentLine.current.forEach((point, idx) => {
        if (idx === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }

    ctx.restore();
  };

  const redraw = () => redrawWith(drawnLines);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // 우클릭 메뉴 차단
  };

  useEffect(() => {
    redraw();
  }, [offset, scale, drawnLines]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      style={{
        border: '1px solid white',
        touchAction: 'none',
        cursor: isMiddleDragging ? 'grabbing' : isDrawing ? 'crosshair' : 'default',
      }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={handleContextMenu}
    />
  );
};

export default InfiniteCanvas;
