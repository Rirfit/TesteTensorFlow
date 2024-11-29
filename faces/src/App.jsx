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
  
      // Ponto fixo de referência (ex.: ponto do nariz)
      const nose = keypoints[6]; // Usando o nariz como ponto fixo
  
      // Distância entre os olhos para ajuste de escala
      const leftEye = keypoints[33];
      const rightEye = keypoints[263];
      const eyeDistance = Math.hypot(rightEye[0] - leftEye[0], rightEye[1] - leftEye[1]);
  
      // Ajuste da posição dos óculos com base no ponto fixo, corrigindo a inversão no eixo X
      glasses.position.set(
          -(nose[0] - videoWidth / 2) / 100, // Inverte o valor no eixo horizontal
          -(nose[1] - videoHeight / 2) / 100, // Centraliza verticalmente
          -(nose[2] || 0) / 100 // Ajuste de profundidade
      );
  
      // Escala dos óculos proporcional à distância entre os olhos
      const scale = eyeDistance * 0.015; // Ajuste fino para a escala
      glasses.scale.set(scale, scale, scale);
  
      // Rotação baseada na inclinação entre os olhos
      const angle = Math.atan2(rightEye[1] - leftEye[1], rightEye[0] - leftEye[0]);
      glasses.rotation.set(0, 0, angle);
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
            height: 480,
            transform: "scaleX(-1)"
          }} />
        </div>
      </header>
    </div>
  );
}

export default App;
