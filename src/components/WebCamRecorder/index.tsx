// src/components/WebcamRecorder/index.tsx

import React, { useRef, useEffect, useState } from 'react';
import { Camera, Video, Eye, EyeOff, Download } from 'lucide-react';
import { useWebcam } from './hooks/useWebcam';
import { useRecording } from './hooks/useRecording';

const WebcamRecorder: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isBlurred, setIsBlurred] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const { stream, error } = useWebcam();
  const {
    isRecording,
    recordedChunks,
    startRecording,
    stopRecording,
    downloadRecording
  } = useRecording(stream);

  // Set up video stream whenever stream or showPreview changes
  useEffect(() => {
    if (videoRef.current && stream && showPreview) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream, showPreview]);

  // Handle canvas effects
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !stream || !showPreview) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    const drawFrame = () => {
      if (!video || !canvas) return;
      
      // Set canvas size to match video dimensions
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      
      // Clear the canvas before drawing
      ctx.clearRect(0, 0, width, height);
      
      // Draw the original video frame
      ctx.drawImage(video, 0, 0, width, height);
      
      if (isBlurred) {
        // Save the current canvas state
        ctx.save();
        
        // Apply blur filter
        ctx.filter = 'blur(12px)';
        
        // Draw the blurred version
        ctx.drawImage(canvas, 0, 0, width, height);
        
        // Restore the canvas state
        ctx.restore();
        
        // Draw the original face area (optional: for better face visibility)
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 4;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();
      }
      
      // Request next frame
      animationRef.current = requestAnimationFrame(drawFrame);
    };

    // Start animation when video plays
    const handlePlay = () => {
      drawFrame();
    };

    video.addEventListener('play', handlePlay);

    // Start drawing if video is already playing
    if (!video.paused) {
      drawFrame();
    }

    // Cleanup function
    return () => {
      video.removeEventListener('play', handlePlay);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stream, isBlurred, showPreview]);

  // Handle preview toggle
  const togglePreview = () => {
    if (!showPreview && stream) {
      // When showing preview, ensure we reset the video stream
      if (videoRef.current) {
        videoRef.current.srcObject = null; // Clear existing stream
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(console.error);
          }
        }, 0);
      }
    }
    setShowPreview(!showPreview);
  };

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error accessing webcam: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <div className="relative w-full max-w-2xl aspect-video bg-gray-800 rounded-lg overflow-hidden">
        {showPreview ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-white">Preview hidden</p>
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center px-4 py-2 rounded-lg ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition-colors`}
        >
          <Camera className="w-5 h-5 mr-2" />
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        
        <button
          onClick={() => setIsBlurred(!isBlurred)}
          className={`flex items-center px-4 py-2 rounded-lg ${
            isBlurred ? 'bg-purple-500' : 'bg-gray-500'
          } text-white hover:opacity-90 transition-opacity`}
        >
          <Video className="w-5 h-5 mr-2" />
          {isBlurred ? 'Remove Blur' : 'Blur Background'}
        </button>
        
        <button
          onClick={togglePreview}
          className="flex items-center px-4 py-2 rounded-lg bg-gray-500 text-white hover:opacity-90 transition-opacity"
        >
          {showPreview ? (
            <>
              <EyeOff className="w-5 h-5 mr-2" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="w-5 h-5 mr-2" />
              Show Preview
            </>
          )}
        </button>
        
        {recordedChunks.length > 0 && (
          <button
            onClick={downloadRecording}
            className="flex items-center px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </button>
        )}
      </div>
    </div>
  );
};

export default WebcamRecorder;

