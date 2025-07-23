import React,{useRef, useEffect, useState} from "react";
import { useCanvasState } from './hooks/useCanvasState';
import { useDrawing } from './hooks/useDrawing';
import { useElementManipulation } from './hooks/useElementManipulation';
import { usePersistence } from './hooks/usePersistence';
import { useCanvasRendering } from './hooks/useCanvasRendering';
import { Toolbar } from './Toolbar'; // Toolbar 컴포넌트 임포트
import './InfiniteCanvas.css';
import type { Point, LineElement } from './types'; // 타입 임포트
import { v4 as uuidv4 } from 'uuid'; // UUID 생성기 임포트

const InfiniteCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement|null>(null);

    // 1. 캔버스 기본 상태 (오프셋, 스케일, 도구) 관리
    const { 
        offset, setOffset,
        scale, setScale,
        tool, setTool, 
        getCanvasCoords 
    } = useCanvasState(canvasRef);

    // 2. 그리기(선) 관련 로직 관리
    const {
        isDrawing,setIsDrawing,
        drawnLines,setDrawnLines,
        currentLine,eraseAtPointer,
    } = useDrawing(getCanvasCoords, tool);

    // 3. 요소 조작(이미지/텍스트 이동) 관련 로직 관리
    const {
        images,setImages,
        textBoxes,setTextBoxes,
        movingObject,setMovingObject,
        handleTextTool,
        moveElement,
    } = useElementManipulation(getCanvasCoords, tool);

    // 4. 데이터 저장 및 불러오기 관련 로직 관리
    const { handleSave, handleLoad, handleImageUpload } = usePersistence(
        drawnLines,
        images,
        textBoxes,
        setDrawnLines, // 로드 후 상태 업데이트를 위해 전달
        setImages,
        setTextBoxes,
    );

    // 5. 캔버스 렌더링 로직 관리
    const { redrawWith } = useCanvasRendering(
        canvasRef,
        offset,
        scale,
        currentLine.current
    );

    // 모든 상태 변화 시 캔버스 다시 그리기 (rendering hook으로 통합)
    useEffect(() => {
        redrawWith(drawnLines, images, textBoxes);
    }, [offset, scale, drawnLines, images, textBoxes, redrawWith]);


    // 자동 로드
    useEffect(() => {
        handleLoad();
    }, [handleLoad]); // handleLoad가 변경될 때마다 호출 (useCallback으로 감싸면 안정적)

    // 자동 저장
    useEffect(() => {
        const timeout = setTimeout(() => {
        handleSave();
        }, 1000);

        return () => clearTimeout(timeout);
    }, [drawnLines, images, textBoxes, handleSave]); // handleSave가 변경될 때마다 호출

    // 키보드 단축키
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'e') setTool('eraser');
        else if (e.key === 'p') setTool('pen');
        else if (e.key === 'h') setTool('handle');
        else if (e.key === 't') setTool('text');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setTool]); // setTool이 변경될 때마다 호출

    // 마우스/터치 이벤트 핸들러 (핵심 로직은 훅 내부로 이동)
    const pointers = useRef<Map<number, Point>>(new Map()); // 포인터 추적은 여기에 유지
    const lastTouchDistance = useRef<number | null>(null);
    const lastTouchCenter = useRef<Point | null>(null);
    const [isMiddleDragging, setIsMiddleDragging] = useState(false);
    const middleDragStart = useRef<Point | null>(null);

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

        // 도구별 로직 호출
        if (tool === 'eraser') {
        eraseAtPointer(e);
        } else if (tool === 'pen') {
        const { x, y } = getCanvasCoords(e);
        currentLine.current = [{ x, y }];
        setIsDrawing(true);
        } else if (tool === 'handle') {
        setMovingObject(null);
        const { x, y } = getCanvasCoords(e);
        // 이미지 클릭 감지
        for (let i = images.length - 1; i >= 0; i--) {
            const img = images[i];
        if (x >= img.x && x <= img.x + img.width && y >= img.y && y <= img.y + img.height) {
        setMovingObject({ type: 'image', index: i , id: img.id });
        return;
        }
        }
        // 텍스트 박스 클릭 감지
        for (let i = textBoxes.length - 1; i >= 0; i--) {
        const box = textBoxes[i];
        const textWidth = 1000, textHeight = 300;
        if (x >= box.x && x <= box.x + textWidth && y >= box.y && y <= box.y + textHeight) {
        setMovingObject({ type: 'text', index: i, id: box.id });
        return;
        }
        }
        } else if (tool === 'text') {
        handleTextTool(e); // 텍스트 툴 로직 호출
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
            const dx = newCenter.x - lastTouchCenter.current.x;
            const dy = newCenter.y - lastTouchCenter.current.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        }
        lastTouchDistance.current = newDistance;
        lastTouchCenter.current = newCenter;
        } else if (tool === 'eraser') {
            eraseAtPointer(e);
        } else if (tool === 'pen' && isDrawing) {
            const { x, y } = getCanvasCoords(e);
            currentLine.current.push({ x, y });
            redrawWith(drawnLines, images, textBoxes); // 매 프레임 그리기
        } else if (tool === 'handle' && movingObject) {
            moveElement(e); // useElementManipulation 훅에서 이동 로직 처리
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
                const newLine: LineElement = {
                    id: uuidv4(),
                    points: finishedLine,
                    status: 'new', // 새로 그린 선은 'new' 상태로 설정
                };
                const updated = [...prev, newLine];
                return updated;
            });
        }
        setMovingObject(null);
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const scaleFactor = 1.1;
        const newScale = e.deltaY < 0 ? scale * scaleFactor : scale / scaleFactor;
        setScale(newScale);
    };

    const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

    // 핀치 줌/이동 유틸리티 함수 (외부로 분리 가능)
    const getDistance = (p1: Point, p2: Point) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const getCenter = (p1: Point, p2: Point): Point => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });


    return (
        <div>
            {/* Toolbar */}
            <Toolbar
                tool={tool}
                setTool={setTool}
                handleImageUpload={handleImageUpload}
                handleSave={handleSave}
                handleLoad={handleLoad}
            />
            {/* Canvas */}
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
                onPointerLeave={handlePointerUp} // 캔버스 밖으로 나갈 때도 포인터 업 처리
                onContextMenu={handleContextMenu}
            />
    </div>
  );
};

export default InfiniteCanvas;
