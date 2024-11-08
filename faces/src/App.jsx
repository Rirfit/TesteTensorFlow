import { useRef, useEffect } from 'react';
import * as tf from "@tensorflow/tfjs";
import * as facemesh from "@tensorflow-models/facemesh";
import Webcam from "react-webcam";
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import './App.css';

function App() {
  const webcamRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 640 / 480, 0.1, 1000);
    camera.position.z = 5;
    camera.position.x = 0;
    camera.position.y = 0;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(640, 480);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = 0;
    renderer.domElement.style.left = 0;
    renderer.domElement.style.zIndex = 9; // Coloca o renderer acima da webcam

    // Adicione o renderer ao container da webcam
    const webcamContainer = document.getElementById('webcam-container');
    if (webcamContainer) {
      webcamContainer.appendChild(renderer.domElement);
    }

    let glasses;

    const loadGlassesModel = () => {
      const mtlLoader = new MTLLoader();
      mtlLoader.load('/frames/frame1/oculos.mtl', (materials) => {
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load('/frames/frame1/oculos.obj', (object) => {
          object.scale.set(0.1, 0.1, 0.1); // Ajuste de escala conforme necessário
          scene.add(object);
          glasses = object;
        });
      });
    };

    const updateGlassesPosition = (keypoints, videoWidth, videoHeight) => {
      if (!glasses) return;

      const leftEye = keypoints[33];
      const rightEye = keypoints[263];

      const eyeX = (leftEye[0] + rightEye[0]) / 2;
      const eyeY = (leftEye[1] + rightEye[1]) / 2;
      const eyeDistance = Math.hypot(rightEye[0] - leftEye[0], rightEye[1] - leftEye[1]);

      glasses.position.set((eyeX - videoWidth / 2) / 100, -(eyeY - videoHeight / 2) / 100, 0);

      // Ajuste de escala para óculos menores
      glasses.scale.set(eyeDistance * 0.015, eyeDistance * 0.015, eyeDistance * 0.015);
      glasses.rotation.x = 0;
      glasses.rotation.y = Math.atan2(rightEye[1] - leftEye[1], rightEye[0] - leftEye[0]);
      glasses.rotation.z = 0;
    };

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();
    loadGlassesModel();

    const loadModel = async () => {
      await tf.setBackend('webgl');
      await tf.ready();

      const net = await facemesh.load({
        inputResolution: { width: 640, height: 480 },
        scale: 0.8,
      });

      const detect = async () => {
        if (webcamRef.current && webcamRef.current.video.readyState === 4) {
          const video = webcamRef.current.video;
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          const face = await net.estimateFaces(video);

          if (face.length > 0) {
            updateGlassesPosition(face[0].scaledMesh, videoWidth, videoHeight);
          }
        }
      };

      const detectionLoop = () => {
        detect();
        requestAnimationFrame(detectionLoop);
      };

      detectionLoop();
    };

    loadModel();
  }, []);

  return (
    <div className="app">
      <header className="App-header">
        <div id="webcam-container" style={{ position: "relative", width: 640, height: 480 }}>
          <Webcam ref={webcamRef} style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 8,
            width: 640,
            height: 480
          }} />
        </div>
      </header>
    </div>
  );
}

export default App;
