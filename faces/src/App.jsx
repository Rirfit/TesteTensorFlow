import { useState, useRef } from 'react'
import * as tf from "@tensorflow/tfjs"
import * as facemesh from "@tensorflow-models/facemesh"
import Webcam from "react-webcam"
import './App.css'
import { drawMesh } from './utilities'



function App() {
  //setup referencias
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  //load facemesh
  const runFacemesh = async () =>{
    const net = await facemesh.load({
      inputResolution:{width:640, height:480}, scale:0.8
    });
    setInterval(() => {
      detect(net)  
    }, 500)
  };

  //detect function
  const detect = async(net) =>{
    if(typeof webcamRef.current !== "undefined" && webcamRef.current !== null && webcamRef.current.video.readyState === 4){
      //get propriedade do video
      const video = webcamRef.current.video
      const videoWidth = webcamRef.current.video.videoWidth
      const videoHeight = webcamRef.current.video.videoHeight

      //set video largura
      webcamRef.current.video.width = videoWidth
      webcamRef.current.video.height = videoHeight

      //set canvas largura e altura
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      //detection
      const face = await net.estimateFaces(video);
      console.log(face);

      //contexto do canvas para desenhar
      const ctx = canvasRef.current.getContext("2d");
      drawMesh(face, ctx)
    }
  }

  runFacemesh();
  return (
    <>
     <div className="app">
      <header className='App-header'>
      <Webcam ref={webcamRef} style={
        {
          position:"absolute",
          marginLeft:"auto",
          marginRight:"auto",
          left:0,
          right:0,
          textAlign:"center",
          zindex:9,
          width: 640,
          height:480
        }
      }/>
      <canvas ref={canvasRef} style={
        {
          position:"absolute",
          marginLeft:"auto",
          marginRight:"auto",
          left:0,
          right:0,
          textAlign:"center",
          zindex:9,
          width: 640,
          height:480}
      }/>
      </header>
     </div>
     
    </>
  )
}

export default App