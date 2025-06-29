import React, { useRef, useState, useEffect } from 'react';
import './InfiniteCanvas.css';
// shit hand function fucking
// issue : text box don't move with hand function

// 선, 이미지, 텍스트 박스를 위한 타입 정의
type Point = { x: number; y: number };
type ImageElement = { image: HTMLImageElement; x: number; y: number; width: number; height: number };
type TextBox = { text: string; x: number; y: number };

const InfiniteCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 뷰포트 오프셋 및 확대 비율
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // 선 그리기 관련 상태
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnLines, setDrawnLines] = useState<Point[][]>([]);
  const currentLine = useRef<Point[]>([]);

  // 이미지 및 텍스트 요소
  const [images, setImages] = useState<ImageElement[]>([]);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);

  // 터치 또는 마우스 핀치/이동을 위한 포인터 추적
  const pointers = useRef<Map<number, Point>>(new Map());
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<Point | null>(null);

  // 마우스 휠 클릭으로 화면 이동
  const [isMiddleDragging, setIsMiddleDragging] = useState(false);
  const middleDragStart = useRef<Point | null>(null);

  // 현재 선택된 도구: 'pen' | 'eraser' | 'handle' | 'text'
  const [tool, setTool] = useState<'pen' | 'eraser' | 'handle' | 'text'>('pen');

  // 텍스트 박스 이동 추적
  const [movingObject, setMovingObject] = useState<{ type: 'image' | 'text'; index: number } | null>(null);

  // 브라우저 기준 좌표를 캔버스 좌표로 변환
  const getCanvasCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale,
    };
  };

  // 거리와 중심 좌표 계산 (핀치 줌용)
  const getDistance = (p1: Point, p2: Point) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
  const getCenter = (p1: Point, p2: Point): Point => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });

  // 포인터 다운 처리
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, pos);

    // 마우스 휠로 이동
    if (e.pointerType === 'mouse' && e.button === 1) {
      setIsMiddleDragging(true);
      middleDragStart.current = pos;
      return;
    }

    // 두 손가락 터치
    if (pointers.current.size === 2) {
      const [p1, p2] = Array.from(pointers.current.values());
      lastTouchDistance.current = getDistance(p1, p2);
      lastTouchCenter.current = getCenter(p1, p2);
    }

    // 도구 별로 동작
    if (tool === 'eraser') {
      eraseAtPointer(e);
    } else if (tool === 'pen') {
      const { x, y } = getCanvasCoords(e);
      currentLine.current = [{ x, y }];
      setIsDrawing(true);
    } else if (tool === 'handle') {
      // 이미지나 텍스트 클릭 감지
      const { x, y } = getCanvasCoords(e);
      for (let i = images.length - 1; i >= 0; i--) {
        const img = images[i];
        if (x >= img.x && x <= img.x + img.width && y >= img.y && y <= img.y + img.height) {
          setMovingObject({ type: 'image', index: i });
          return;
        }
      }
      for (let i = textBoxes.length - 1; i >= 0; i--) {
        const box = textBoxes[i];
        const textWidth = 100, textHeight = 30;
        if (x >= box.x && x <= box.x + textWidth && y >= box.y && y <= box.y + textHeight) {
          setMovingObject({ type: 'text', index: i });
          return;
        }
      }
    } else if (tool === 'text') {
      const { x, y } = getCanvasCoords(e);
      const newText = prompt('Enter text:');
      if (newText) {
        setTextBoxes(prev => [...prev, { text: newText, x, y }]);
      }
    }
  };

  // 포인터 이동 처리
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = { x: e.clientX, y: e.clientY };

    // 마우스 휠 드래그로 이동
    if (isMiddleDragging && middleDragStart.current) {
      const dx = pos.x - middleDragStart.current.x;
      const dy = pos.y - middleDragStart.current.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      middleDragStart.current = pos;
      return;
    }

    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, pos);

    // 핀치 줌 동작
    if (pointers.current.size === 2) {
      const [p1, p2] = Array.from(pointers.current.values());
      const newDistance = getDistance(p1, p2);
      const newCenter = getCenter(p1, p2);

      if (lastTouchDistance.current && lastTouchCenter.current) {
        const scaleFactor = newDistance / lastTouchDistance.current;
        setScale(prev => prev * scaleFactor);
        const dx = newCenter.x - lastTouchCenter.current.x;
        const dy = newCenter.y - lastTouchCenter.current.y;
        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      }

      lastTouchDistance.current = newDistance;
      lastTouchCenter.current = newCenter;
    } 
    else if (tool === 'eraser') {
      eraseAtPointer(e);
    } else if (tool === 'pen' && isDrawing) {
      const { x, y } = getCanvasCoords(e);
      currentLine.current.push({ x, y });
      redraw();
    } else if (tool === 'handle' && movingObject) {
      const { x, y } = getCanvasCoords(e);
      if (movingObject.type === 'image') {
        setImages(prev => {
          const newImgs = [...prev];
          newImgs[movingObject.index] = { ...newImgs[movingObject.index], x, y };
          return newImgs;
        });
      } else if (movingObject.type === 'text') {
        setTextBoxes(prev => {
          const newBoxes = [...prev];
          newBoxes[movingObject.index] = { ...newBoxes[movingObject.index], x, y };
          return newBoxes;
        });
      }
    }
  };

  // 포인터 해제 시 처리
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

    setMovingObject(null);
  };

  // 지우기 기능 (마우스 주변 일정 거리의 선 삭제)
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

  // 마우스 휠 줌 처리
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const scaleFactor = 1.1;
    const newScale = e.deltaY < 0 ? scale * scaleFactor : scale / scaleFactor;
    setScale(newScale);
  };

  // 전체 요소 다시 그리기
  const redrawWith = (lines: Point[][], imgs = images, texts = textBoxes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // 이미지
    imgs.forEach(img => {
      ctx.drawImage(img.image, img.x, img.y, img.width, img.height);
    });

    // 선
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

    // 텍스트
    texts.forEach(box => {
      ctx.fillStyle = 'black';
      ctx.font = '16px sans-serif';
      ctx.fillText(box.text, box.x, box.y);
    });

    // 현재 그리는 선
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

  // 이미지 업로드 처리
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

  // 키보드 단축키로 도구 변경
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e') setTool('eraser');
      else if (e.key === 'p') setTool('pen');
      else if (e.key === 'h') setTool('handle');
      else if (e.key === 't') setTool('text');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 상태 변경 시 리렌더링
  useEffect(() => {
    redraw();
  }, [offset, scale, drawnLines, images, textBoxes]);
  // 캔버스 저장하기
  const handleSave = async () => {
    const lineData = drawnLines.map(line => ({
      points: line.map(p => ({ x: p.x, y: p.y }))
    }));
  
    const imageData = images.map(img => ({
      x: img.x,
      y: img.y,
      width: img.width,
      height: img.height,
      url: img.image.src,  // <- 여기 중요
    }));
  
    const textData = textBoxes.map(box => ({
      x: box.x,
      y: box.y,
      content: box.text,
    }));
  
    const payload = {
      lines: lineData,
      images: imageData,
      textBoxes: textData
    };
  
    await fetch("http://localhost:8080/api/canvas/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  
    alert("저장 완료!");
  };

  // 전체 UI 및 캔버스 구성
  return (
    <div>
      <div style={{ position: 'fixed', top: 10, left: 10, zIndex: 10 }}>
        <button onClick={() => setTool('pen')}>Pen</button>
        <button onClick={() => setTool('eraser')}>Eraser</button>
        <button onClick={() => setTool('handle')}>Handle</button>
        <button onClick={() => setTool('text')}>Text</button>
        <button onClick={handleSave}>Save</button>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </div>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{
          border: '1px solid white',
          touchAction: 'none',
          cursor:
            isMiddleDragging ? 'grabbing' :
            isDrawing ? 'crosshair' :
            tool === 'eraser' ? 'cell' :
            tool === 'handle' ? 'move' :
            'default',
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
