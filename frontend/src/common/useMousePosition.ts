import React from "react";

const useMousePosition = () => {
  const [
    mousePosition,
    setMousePosition
  ] = React.useState<{ x?: number, y?: number }>({ x: undefined, y: undefined });

  React.useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    };
    const handleTouchStart = (ev: TouchEvent) => {
      const touches = ev.changedTouches;
      setMousePosition({ x: touches[0].clientX, y: touches[0].clientY });
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("touchstart", handleTouchStart);
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);
  return mousePosition;
};

export default useMousePosition;
