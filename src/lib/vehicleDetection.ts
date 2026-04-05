import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

let modelPromise: Promise<cocoSsd.ObjectDetection> | null = null;

export const loadModel = () => {
  if (!modelPromise) {
    modelPromise = cocoSsd.load({
      base: 'lite_mobilenet_v2'
    });
  }
  return modelPromise;
};

export const detectVehicles = async (image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => {
  const model = await loadModel();
  const predictions = await model.detect(image);
  
  // Filter for vehicles only
  const vehicleClasses = ['car', 'motorcycle', 'truck', 'bus'];
  return predictions.filter(p => vehicleClasses.includes(p.class));
};
