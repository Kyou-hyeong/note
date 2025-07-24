import { useCallback } from 'react';
import type { LineElement, ImageElement, TextBoxElement, CanvasLoadData, CanvasSavePayload } from '../types';
import { v4 as uuidv4 } from 'uuid';
import type { Dispatch, SetStateAction } from 'react';

// React.Dispatch 함수 타입을 명확히 정의
type SetLines = Dispatch<SetStateAction<LineElement[]>>;
type SetImages = Dispatch<SetStateAction<ImageElement[]>>;
type SetTextBoxes = Dispatch<SetStateAction<TextBoxElement[]>>;

export const usePersistence = (
  drawnLines: LineElement[],
  images: ImageElement[],
  textBoxes: TextBoxElement[],
  setDrawnLines: SetLines,
  setImages: SetImages,
  setTextBoxes: SetTextBoxes
) => {

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  const handleSave = useCallback(async () => {
    // TODO: 여기에서 델타 업데이트 로직 구현 (new, modified, deleted 분리)
    // 현재는 모든 데이터를 보내는 방식
    const lineData = drawnLines.map(line => {
      if (line.status === 'deleted') return null; // deleted 상태는 제외
      if (line.status === 'unchanged') {
        return {
          id: line.id,
          points: line.points
        };
      } else if (line.status === 'new' || line.status === 'modified') {
        return {
          id: line.id,
          points: line.points,
          status: line.status   // 새로 추가된 선은 'new' 상태로 저장
        };
      }
    }).filter(Boolean) as LineElement[]; // null 제거

    const imageData = images.map(img => ({
      id: img.id, // ID 포함
      x: img.x, y: img.y, width: img.width, height: img.height,
      url: img.url, // URL 사용
    }));
    const textData = textBoxes.map(box => ({
      id: box.id, // ID 포함
      x: box.x, y: box.y,
      width: box.width, height: box.height,
      text: box.text,
    }));

    const payload: CanvasSavePayload = {
      lines: lineData,
      images: imageData,
      textBoxes: textData
    };

    try {
      const res = await fetch(`${API_URL}/api/canvas/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      console.log("Canvas data saved successfully!");
    } catch (err) {
      console.error("저장 실패:", err);
      // alert("저장에 실패했습니다."); // 배포 시에는 alert 지양
    }
  }, [drawnLines, images, textBoxes, API_URL]);


  const handleLoad = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/canvas/load`);
      if (!res.ok) throw new Error("데이터 로드 실패");
      const data: CanvasLoadData = await res.json();
      console.log("불러온 데이터:", data);

      // 기존 데이터 클리어 (부분 업데이트 후에는 필요 없을 수 있음)
      setDrawnLines([]);
      setImages([]);
      setTextBoxes([]);

      const loadedLines: LineElement[] = (data.lines ?? []).map(line => ({
        id: line.id,
        points: line.points,
        status: 'unchanged' // 로드된 데이터는 'unchanged' 상태로 초기화
      }));

      // 이미지 변환: Promise.all로 병렬 처리하여 로드 지연 감소
      const loadedImgs: ImageElement[] = await Promise.all(
        (data.images ?? []).map((imgData: any) => {
          return new Promise<ImageElement>((resolve) => {
            const image = new Image();
            image.onload = () => {
              resolve({
                id: imgData.id,
                image,
                url: imgData.url, // URL도 함께 저장
                x: imgData.x, y: imgData.y, width: imgData.width, height: imgData.height,
                status: 'unchanged'
              });
            };
            image.onerror = () => {
              console.warn("이미지 로드 실패:", imgData.url);
              resolve({
                id: imgData.id,
                image: new Image(), // 실패 시 빈 이미지
                url: imgData.url,
                x: imgData.x, y: imgData.y, width: imgData.width, height: imgData.height,
                status: 'unchanged'
              });
            };
            image.src = imgData.url;
          });
        })
      );

      const loadedTextBoxes: TextBoxElement[] = (data.textBoxes ?? []).map((t: any) => ({
        id: t.id,
        text: t.content,
        x: t.x, y: t.y,
        width: t.width, height: t.height,
        status: 'unchanged'
      }));

      setDrawnLines(loadedLines);
      setImages(loadedImgs);
      setTextBoxes(loadedTextBoxes);

      console.log("캔버스 데이터 로드 및 적용 완료.");
    } catch (error) {
      console.error("불러오기 실패:", error);
    }
  }, [API_URL, setDrawnLines, setImages, setTextBoxes]);


  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("이미지 업로드 실패");

      const data = await res.json();
      const imageUrl = `${API_URL}/uploads/${data.filename}`;

      const img = new Image();
      img.onload = () => {
        const imgElement: ImageElement = {
          id: uuidv4(), // 이미지에도 고유 ID 부여
          image: img,
          url: imageUrl, // URL도 저장
          x: 100, y: 100,
          width: img.width * 0.5,
          height: img.height * 0.5,
          status: 'new' // 새로 추가된 상태
        };
        setImages(prev => [...prev, imgElement]);
      };
      img.src = imageUrl;
    } catch (err) {
      console.error("업로드 실패:", err);
      // alert("이미지 업로드 실패");
    }
  }, [API_URL, setImages]);

  return { handleSave, handleLoad, handleImageUpload };
};