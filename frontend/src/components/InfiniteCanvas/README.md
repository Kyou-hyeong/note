hook/
    ├ useCanvasRendering.tsx - 캔버스 렌더링
    │   redrawWith    
    ├ useCanvasState.tsx - 캔버스의 상태
    │   getCanvasCoords 브라우저 기준 좌표를 캔버스 좌표로 변환
    ├ useDrawing.tsx - 선이나 이미지/텍스트 그리기
    │   eraseAtPointer
    ├ useElementManipulation.tsx - 이미지/텍스트 조작
    │   handleTextTool, moveElement
    ├ usePersistence.tsx - 캔버스 정보 통신
    │   handleLoad, handleSave, handleImageUpload - 백엔드 전송 관련
    └   

index.tsx - 캔버스와 도구바가 실질적으로 배치되는 곳
    // 실질적인 그리기 기능
    handlePointDown - 키를 누르는 중일 때
    handlePointMove - 키를 누르고 있을 떄
    handlePointerUp - 키를 땔 때
    // 화면 축소/이동
    handleWheel - 마우스 휠: 확대 축소
    handleContextMenu - 마우스 왼쪽 방지 
    getDistance - 손가락 확대
    getCenter - 손가락 확대
ToolBar.tsx - 도구바 관리
type.tsx - 캔버스에 사용되는 타입 정의
css - 디자인 관리