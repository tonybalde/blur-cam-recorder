// src/components/WebcamRecorder/types.ts

export interface WebcamState {
    isRecording: boolean;
    stream: MediaStream | null;
    recordedChunks: Blob[];
    isBlurred: boolean;
    showPreview: boolean;
  }
  
  export interface WebcamControls {
    startRecording: () => void;
    stopRecording: () => void;
    toggleBlur: () => void;
    togglePreview: () => void;
    downloadRecording: () => void;
  }