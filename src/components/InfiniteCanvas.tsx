import React, { useRef, useState, useEffect } from 'react';
import './InfiniteCanvas.css';

type Point = { x: number; y: number };
type ImageElement = { image: HTMLImageElement; x: number; y: number; width: number; height: number };

const InfiniteCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 이동 및 확대 상태
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // 선 그리기 관련 상태
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnLines, setDrawnLines] = useState<Point[][]>([]);
  const currentLine = useRef<Point[]>([]);

  // 이미지 리스트
  const [images, setImages] = useState<ImageElement[]>([]);

  // 터치 관련 상태
  const pointers = useRef<Map<number, Point>>(new Map());
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<Point | null>(null);

  // 마우스 휠로 드래그 상태
  const [isMiddleDragging, setIsMiddleDragging] = useState(false);
  const middleDragStart = useRef<Point | null>(null);

  // 도구 상태
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  const getCanvasCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale,
    };
  };

  const getDistance = (p1: Point, p2: Point) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
  const getCenter = (p1: Point, p2: Point): Point => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, pos);

    if (e.pointerType === 'mouse' && e.button === 1) {
      setIsMiddleDragging(true);
      middleDragStart.current = pos;
      return;
    }

    if (pointers.current.size === 2) {
      const [p1, p2] = Array.from(pointers.current.values());
      lastTouchDistance.current = getDistance(p1, p2);
      lastTouchCenter.current = getCenter(p1, p2);
    }

    if (tool === 'eraser') {
      eraseAtPointer(e);
    } else if (pointers.current.size === 1 && (e.pointerType === 'pen' || (e.pointerType === 'mouse' && e.button === 0))) {
      const { x, y } = getCanvasCoords(e);
      currentLine.current = [{ x, y }];
      setIsDrawing(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = { x: e.clientX, y: e.clientY };

    if (isMiddleDragging && middleDragStart.current) {
      const dx = pos.x - middleDragStart.current.x;
      const dy = pos.y - middleDragStart.current.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      middleDragStart.current = pos;
      return;
    }

    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, pos);

    if (pointers.current.size === 2) {
      const [p1, p2] = Array.from(pointers.current.values());
      const newDistance = getDistance(p1, p2);
      const newCenter = getCenter(p1, p2);

      if (lastTouchDistance.current && lastTouchCenter.current) {
        const scaleFactor = newDistance / lastTouchDistance.current;
        setScale(prev => prev * scaleFactor);
        setOffset(prev => ({
          x: prev.x + newCenter.x - lastTouchCenter.current!.x,
          y: prev.y + newCenter.y - lastTouchCenter.current!.y,
        }));
      }

      lastTouchDistance.current = newDistance;
      lastTouchCenter.current = newCenter;
    } else if (tool === 'eraser') {
      eraseAtPointer(e);
    } else if (isDrawing) {
      const { x, y } = getCanvasCoords(e);
      currentLine.current.push({ x, y });
      redraw();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);

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
        requestAnimationFrame(() => redrawWith(updated));
        return updated;
      });
    }
  };

  const eraseAtPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const threshold = 10;
    setDrawnLines(prev => {
      const updated = prev.filter(line =>
        !line.some(pt => Math.hypot(pt.x - x, pt.y - y) < threshold)
      );
      requestAnimationFrame(() => redrawWith(updated));
      return updated;
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const scaleFactor = 1.1;
    const newScale = e.deltaY < 0 ? scale * scaleFactor : scale / scaleFactor;
    setScale(newScale);
  };

  const redrawWith = (lines: Point[][], imgs = images) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    imgs.forEach(img => {
      ctx.drawImage(img.image, img.x, img.y, img.width, img.height);
    });

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

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const imgElement: ImageElement = {
        image: img,
        x: 100,
        y: 100,
        width: img.width * 0.5,
        height: img.height * 0.5,
      };
      setImages(prev => {
        const updated = [...prev, imgElement];
        requestAnimationFrame(() => redrawWith(drawnLines, updated));
        return updated;
      });
    };
    img.src = URL.createObjectURL(file);
  };

  useEffect(() => {
    redraw();
  }, [offset, scale, drawnLines, images]);

  return (
    <div>
      {/* 도구 선택 및 이미지 업로드 */}
      <div style={{ position: 'fixed', top: 10, left: 10, zIndex: 10 }}>
        <button onClick={() => setTool('pen')} style={{ marginRight: '10px' }}>Pen</button>
        <button onClick={() => setTool('eraser')} style={{ marginRight: '10px' }}>Eraser</button>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </div>

      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{
          border: '1px solid white',
          touchAction: 'none',
          cursor: isMiddleDragging ? 'grabbing' : isDrawing ? 'crosshair' : tool === 'eraser' ? 'cell' : 'default',
        }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
};

export default InfiniteCanvas;
