import React, { useRef, useState, useEffect } from 'react';
import './InfiniteCanvas.css';

const InfiniteCanvas: React.FC = () => {
  // 캔버스 레퍼런스를 설정합니다.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 이동(offset)과 스케일(zoom) 상태를 관리합니다.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  // 드래그 상태 관련
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // 휠 이벤트: 스케일(확대/축소) 처리
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const scaleFactor = 1.1;
    // 위쪽으로 스크롤하면 확대, 아래쪽이면 축소
    const newScale = e.deltaY < 0 ? scale * scaleFactor : scale / scaleFactor;
    setScale(newScale);
  };

  // 마우스 다운: 드래그 시작
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    switch (e.button){
      case 0: //왼쪽 클릭
        break;
      case 1: //휠 클릭
        e.preventDefault();
        setIsDragging(true);
        // 캔버스 좌표 대신 전체 창 좌표(e.clientX, e.clientY) 사용 – 필요시 캔버스의 위치(offsetLeft 등)을 고려
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        break;
      case 2: //오른쪽 클릭
        
        break;

    }
    
  };

  // 마우스 이동: 드래그 중이면 오프셋을 업데이트
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  // 마우스 업 혹은 캔버스 밖으로 벗어날 때 드래깅 중지
  const handleMouseUp = () => {setIsDragging(false);setDragStart(null);};
  const handleContextMenu = (e: React.MouseEvent) => {e.preventDefault();};
  

  // 캔버스 드로잉: offset과 scale이 업데이트될 때마다 재랜더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 캔버스 전체 클리어
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        // 이동(팬) 및 확대/축소 변환 적용
        ctx.translate(offset.x, offset.y);
        ctx.scale(scale, scale);

        // 예시: 그리드 그리기
        const gridSize = 50;
        ctx.beginPath();
        // 수평선
        for (let x = -canvas.width; x < canvas.width; x += gridSize) {
          ctx.moveTo(x, -canvas.height);
          ctx.lineTo(x, canvas.height);
        }
        // 수직선
        for (let y = -canvas.height; y < canvas.height; y += gridSize) {
          ctx.moveTo(-canvas.width, y);
          ctx.lineTo(canvas.width, y);
        }
        ctx.strokeStyle = '#ccc';
        ctx.stroke();

        // 여기에 노트 필기 내용이나 다른 요소들을 추가해서 자유롭게 캔버스에 그릴 수 있습니다.
        ctx.restore();
      }
    }
  }, [offset, scale]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      style={{ border: '1px solid black', cursor: isDragging ? 'grabbing' : 'grab' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    />
  );
};

export default InfiniteCanvas;
