import { useState, useEffect } from 'react';

export const useWebcam = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initWebcam = async () => {
      try {
        const userMedia = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setStream(userMedia);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to access webcam'));
      }
    };

    initWebcam();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return { stream, error };
};