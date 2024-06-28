import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { SelfieSegmentation, Results } from '@mediapipe/selfie_segmentation';
import { Camera } from '@mediapipe/camera_utils';
import './webcamComponent.css';

const WebcamComponent: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  useEffect(() => {
    const selfieSegmentation = new SelfieSegmentation({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });

    selfieSegmentation.setOptions({
      modelSelection: 1,
    });

    selfieSegmentation.onResults(onResults);

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          await selfieSegmentation.send({ image: webcamRef.current!.video! });
        },
        width: 1280,
        height: 720,
      });
      camera.start();
    }
  }, []);

  const onResults = (results: Results) => {
    const canvasElement = canvasRef.current!;
    const canvasCtx = canvasElement.getContext('2d')!;
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    if (results.segmentationMask) {
      canvasCtx.globalCompositeOperation = 'source-in';
      canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.globalCompositeOperation = 'source-out';
      canvasCtx.filter = 'blur(10px)';
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.globalCompositeOperation = 'destination-atop';
      canvasCtx.filter = 'none';
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    }

    canvasCtx.restore();
  };

  const handleStartCaptureClick = useCallback(async () => {
    setCapturing(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (canvasRef.current) {
        const canvasStream = canvasRef.current.captureStream() as MediaStream;
        const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...stream.getAudioTracks()]);

        mediaRecorderRef.current = new MediaRecorder(combinedStream, {
          mimeType: 'video/webm',
        });

        mediaRecorderRef.current.addEventListener('dataavailable', handleDataAvailable);
        mediaRecorderRef.current.start();
      }
    } catch (err) {
      console.error('Error accessing media devices.', err);
    }
  }, [canvasRef, setCapturing, mediaRecorderRef]);

  const handleDataAvailable = useCallback(({ data }: BlobEvent) => {
    if (data.size > 0) {
      setRecordedChunks((prev) => prev.concat(data));
    }
  }, []);

  const handleStopCaptureClick = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setCapturing(false);
    }
  }, [mediaRecorderRef, setCapturing]);

  const handleDownload = useCallback(() => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, {
        type: 'video/webm',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style.display = 'none';
      a.href = url;
      a.download = 'react-webcam-stream-capture.webm';
      a.click();
      window.URL.revokeObjectURL(url);
      setRecordedChunks([]);
    }
  }, [recordedChunks]);

  return (
    <>
       <Webcam audio={true} ref={webcamRef} style={{ display: 'none' }} />
       <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      {capturing ? (
        <button onClick={handleStopCaptureClick}>Stop</button>
      ) : (
        <button onClick={handleStartCaptureClick}>Start Recording</button>
      )}
      {recordedChunks.length > 0 && (
        <button onClick={handleDownload}>Download</button>
      )}
    </>
  );
};

export default WebcamComponent;
