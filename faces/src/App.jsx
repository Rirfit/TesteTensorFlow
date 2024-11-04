import { useRef, useEffect } from 'react';
import * as tf from "@tensorflow/tfjs";
import * as facemesh from "@tensorflow-models/facemesh";
import Webcam from "react-webcam";
 import './App.css';
import { drawMesh } from './utilities';

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Load facemesh
  const runFacemesh = async () => {
    const net = await facemesh.load({
      inputResolution: { width: 640, height: 480 }, scale: 0.8
    });
    setInterval(() => {
      detect(net);
    }, 100);
  };

  // Detect function
  const detect = async (net) => {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const face = await net.estimateFaces(video);
      const ctx = canvasRef.current.getContext("2d");
      drawMesh(face, ctx, videoWidth, videoHeight);
    }
  };

  useEffect(() => { runFacemesh(); }, []);
  
  return (
    <div className="app">
      <header className="App-header">
        <Webcam ref={webcamRef} style={{
          position: "absolute",
          left: 0, right: 0, zIndex: 8, // Posiciona a webcam atrás do renderer
          width: 640, height: 480
        }} />
        <canvas ref={canvasRef} style={{
          position: "absolute",
          left: 0, right: 0,
          margin: "auto", zIndex: 8,
          width: 640, height: 480
        }} />
      </header>
    </div>
  );
}

export default App;
