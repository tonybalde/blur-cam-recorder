// src/App.tsx

import React from 'react';
import WebcamRecorder from './components/WebCamRecorder';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Webcam Recorder
        </h1>
        <WebcamRecorder />
      </div>
    </div>
  );
}

export default App;