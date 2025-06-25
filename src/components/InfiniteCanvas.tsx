import React, { useRef, useState, useEffect } from 'react';
import './InfiniteCanvas.css';

type Point = { x: number; y: number };

const InfiniteCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);

  // 선 그리기 관련
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnLines, setDrawnLines] = useState<Point[][]>([]);
  const currentLine = useRef<Point[]>([]);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const scaleFactor = 1.1;
    const newScale = e.deltaY < 0 ? scale * scaleFactor : scale / scaleFactor;
    setScale(newScale);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    } else if (e.pointerType === 'pen' || e.pointerType === 'touch' || e.pointerType === 'mouse') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / scale;
      const y = (e.clientY - rect.top - offset.y) / scale;

      currentLine.current = [{ x, y }];
      setIsDrawing(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging && dragStart) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (isDrawing) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / scale;
      const y = (e.clientY - rect.top - offset.y) / scale;
      currentLine.current.push({ x, y });
      redraw(); // 실시간으로 보여줌
    }
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
    }
    if (isDrawing) {
      setIsDrawing(false);
      const finishedLine = [...currentLine.current];
      currentLine.current = [];
      setDrawnLines((prev) => {
        const updated = [...prev, finishedLine];
        // 즉시 다시 그리기
        requestAnimationFrame(() => {
          redrawWith(updated);
        });
        return updated;
      });
    }
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
  
    // 격자
    const gridSize = 50;
    ctx.beginPath();
    for (let x = -canvas.width; x < canvas.width; x += gridSize) {
      ctx.moveTo(x, -canvas.height);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = -canvas.height; y < canvas.height; y += gridSize) {
      ctx.moveTo(-canvas.width, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.strokeStyle = '#eee';
    ctx.stroke();
  
    // 저장된 선 그리기
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
  
    ctx.restore();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const redraw = () => redrawWith(drawnLines);

  // 전체 업데이트 시 리렌더
  useEffect(() => {
    redraw();
  }, [offset, scale, drawnLines]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      style={{
        border: '1px solid black',
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'crosshair',
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
