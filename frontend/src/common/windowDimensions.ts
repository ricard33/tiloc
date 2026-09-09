import { useState, useEffect } from 'react';

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

function debounce(fn: () => void, ms: number) {
  let timeoutId: number;
  return () => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(), ms);
  };
}

export default function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    const updateSize = () => {
      setWindowDimensions(getWindowDimensions());
    };
    const debouncedUpdateSize = debounce(updateSize, 100);

    window.addEventListener('resize', debouncedUpdateSize);
    return () => window.removeEventListener('resize', debouncedUpdateSize);
  }, []);

  return windowDimensions;
}
