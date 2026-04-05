"use client";

import React, { useRef, useEffect, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Camera, RefreshCcw, CameraOff, Database } from 'lucide-react';
import { loadModel } from '@/lib/vehicleDetection';

interface TrafficCounterProps {
  onVehicleDetected: (vehicle: any) => void;
  activeCategories: string[];
}

const TrafficCounter: React.FC<TrafficCounterProps> = ({ onVehicleDetected, activeCategories }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize model
  useEffect(() => {
    async function init() {
      try {
        const loadedModel = await loadModel();
        setModel(loadedModel);
        setIsLoading(false);
      } catch (err) {
        console.error("Model loading error:", err);
        setError("Gagal memuat model AI");
      }
    }
    init();
  }, []);

  // Camera handling
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setError(null);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Gagal mengakses kamera. Pastikan izin diberikan.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const prevDetectionsRef = useRef<any[]>([]);

  // Processing loop
  useEffect(() => {
    let animationId: number;
    let lastTime = 0;
    
    const processFrame = async (time: number) => {
      // Throttle to roughly 15 FPS
      if (time - lastTime < 1000 / 15) {
         animationId = requestAnimationFrame(processFrame);
         return;
      }
      lastTime = time;

      if (model && videoRef.current && videoRef.current.readyState === 4 && canvasRef.current) {
        // Sync canvas size with video actual size to ensure accurate drawing
        if (canvasRef.current.width !== videoRef.current.videoWidth) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }

        const predictions = await model.detect(videoRef.current);
        const ctx = canvasRef.current.getContext('2d');
        
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Draw Counting Line (Middle)
          const lineY = canvasRef.current.height / 2;
          ctx.setLineDash([10, 10]);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Red, slightly transparent
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, lineY);
          ctx.lineTo(canvasRef.current.width, lineY);
          ctx.stroke();
          ctx.setLineDash([]);
          
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 16px Inter';
          ctx.fillText('GARIS RADAR (TARGET LINE)', 10, lineY - 10);

          const currentDetections: any[] = [];

          predictions.forEach(prediction => {
            // Lowered confidence threshold for testing to ensure it catches something
            if (activeCategories.includes(prediction.class) && prediction.score > 0.4) {
              const [x, y, width, height] = prediction.bbox;
              const centerX = x + width / 2;
              const centerY = y + height / 2;

              currentDetections.push({
                class: prediction.class,
                bbox: prediction.bbox,
                center: [centerX, centerY],
                score: prediction.score
              });
              
              // Draw bounding box
              ctx.strokeStyle = '#3b82f6';
              ctx.lineWidth = 3;
              ctx.strokeRect(x, y, width, height);
              
              // Draw center dot
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
              ctx.fill();

              // Draw label
              ctx.fillStyle = '#3b82f6';
              ctx.fillRect(x, y - 25, width, 25);
              ctx.fillStyle = 'white';
              ctx.font = 'bold 16px Inter';
              ctx.fillText(`${prediction.class} (${Math.round(prediction.score * 100)}%)`, x + 5, y - 7);

              // Tracking & Counting Logic (Line Crossing)
              let hasCrossed = false;
              
              prevDetectionsRef.current.forEach(prev => {
                if (prev.class === prediction.class) {
                  const [prevX, prevY] = prev.center;
                  // Check if it's the exact same vehicle object using Euclidean distance (max 150px movement between frames)
                  const distance = Math.hypot(prevX - centerX, prevY - centerY);
                  
                  if (distance < 150) {
                    // Check if previous center was on one side and current is on the other side
                    const crossedDown = prevY <= lineY && centerY > lineY;
                    const crossedUp = prevY >= lineY && centerY < lineY;
                    
                    if (crossedDown || crossedUp) {
                      hasCrossed = true;
                      
                      // Visual flash on line cross
                      ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
                      ctx.fillRect(x, y, width, height);
                      
                      onVehicleDetected({
                        id: Math.random().toString(36).substr(2, 9),
                        type: prediction.class,
                        timestamp: Date.now(),
                        confidence: prediction.score
                      });
                    }
                  }
                }
              });
            }
          });

          // Update refs for next frame
          prevDetectionsRef.current = currentDetections;
        }
      }
      
      if (isCameraActive) {
        animationId = requestAnimationFrame(processFrame);
      }
    };

    if (isCameraActive && !isLoading) {
      animationId = requestAnimationFrame(processFrame);
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [model, isCameraActive, isLoading, activeCategories, onVehicleDetected]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800">
      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900/80 backdrop-blur-md">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-medium">Memuat Sistem AI...</p>
        </div>
      ) : (
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
            className="absolute inset-0 w-full h-full pointer-events-none"
            width={640}
            height={480}
          />
          
          {!isCameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-[2px]">
              <button
                onClick={startCamera}
                className="group relative flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-xl"
              >
                <Camera className="w-6 h-6 animate-pulse" />
                Mulai Monitoring
              </button>
              {error && <p className="mt-4 text-red-400 font-medium">{error}</p>}
            </div>
          )}

          {isCameraActive && (
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={stopCamera}
                className="p-3 bg-red-600/80 hover:bg-red-600 text-white rounded-xl backdrop-blur-sm transition-all"
              >
                <CameraOff className="w-5 h-5" />
              </button>
            </div>
          )}
          
          <div className="absolute bottom-4 left-4 z-10 flex gap-2">
            <div className="px-3 py-1 bg-green-500/80 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
              LIVE AI ENGINE
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TrafficCounter;
