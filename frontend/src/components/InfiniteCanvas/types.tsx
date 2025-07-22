// src/components/InfiniteCanvas/types.ts

// 캔버스 요소의 상태를 나타내는 타입 정의
export type CanvasElementStatus = 'new' | 'modified' | 'deleted' | 'unchanged'; // 'deldeted' -> 'deleted'로 수정!

// 선, 이미지, 텍스트 박스를 위한 타입 정의
export type Point = {
    x: number;
    y: number;
};

export type LineElement = {
    id: string;
    points: Point[];
    status?: CanvasElementStatus; // 상태 추가
};

export type ImageElement = {
    id: string;
    image: HTMLImageElement;
    url: string; // 이미지 URL
    x: number;
    y: number;
    width: number;
    height: number;
    status?: CanvasElementStatus; // 상태 추가
};

export type TextBoxElement = {
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    status?: CanvasElementStatus; // 상태 추가
};

// 캔버스 요소들의 통합 타입 (옵션)
export type CanvasElementType = LineElement | ImageElement | TextBoxElement;

// 백엔드와 통신할 페이로드 타입 (예시, 실제 구현에 따라 달라질 수 있음)
export type CanvasSavePayload = {
  lines: Omit<LineElement, 'status'>[];
  images: Omit<ImageElement, 'image' | 'status'>[];
  textBoxes: Omit<TextBoxElement, 'status'>[];
};

export type CanvasLoadData = {
  lines: Omit<LineElement, 'status'>[];
  images: Omit<ImageElement, 'status'>[];
  textBoxes: Omit<TextBoxElement, 'status'>[];
};

export type ToolType = 'pen' | 'eraser' | 'handle' | 'text';