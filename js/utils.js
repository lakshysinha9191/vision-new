// js/utils.js

// Configuration Constants
export const CONFIG = {
  knownHeights: {
    'person': 170, 'bicycle': 100, 'car': 150, 'motorcycle': 120,
    'airplane': 1200, 'bus': 300, 'train': 350, 'truck': 250,
    'boat': 150, 'traffic light': 70, 'fire hydrant': 80,
    'stop sign': 75, 'parking meter': 100, 'bench': 50,
    'bird': 15, 'cat': 25, 'dog': 40, 'horse': 160,
    'sheep': 60, 'cow': 120, 'elephant': 250, 'bear': 100,
    'zebra': 130, 'giraffe': 450, 'backpack': 40, 'umbrella': 60,
    'handbag': 25, 'tie': 60, 'suitcase': 50, 'frisbee': 25,
    'skis': 150, 'snowboard': 140, 'sports ball': 20, 'kite': 50,
    'baseball bat': 90, 'baseball glove': 30, 'skateboard': 80,
    'surfboard': 180, 'tennis racket': 70, 'bottle': 22, 'wine glass': 15,
    'cup': 12, 'fork': 15, 'knife': 20, 'spoon': 15, 'bowl': 12,
    'banana': 20, 'apple': 10, 'sandwich': 8, 'orange': 10,
    'broccoli': 15, 'carrot': 15, 'hot dog': 10, 'pizza': 25,
    'donut': 10, 'cake': 15, 'chair': 90, 'couch': 80,
    'potted plant': 40, 'bed': 50, 'dining table': 75, 'toilet': 45,
    'tv': 60, 'laptop': 25, 'mouse': 4, 'remote': 18,
    'keyboard': 5, 'cell phone': 15, 'microwave': 30, 'oven': 40,
    'toaster': 20, 'sink': 30, 'refrigerator': 150, 'book': 25,
    'clock': 20, 'vase': 25, 'scissors': 15, 'teddy bear': 30,
    'hair drier': 20, 'toothbrush': 15
  },
  defaultHeight: 30, // cm
  focalLength: 600,  // Approximate focal length (needs calibration for accuracy)
  minScore: 0.60,
  scanRate: 100      // ms per frame
};

// Logger Utility
export const Logger = {
  container: null,
  
  init(containerId) {
    this.container = document.getElementById(containerId);
  },

  log(message, type = 'normal') {
    if (!this.container) return;
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.innerHTML = `<span style="opacity:0.5">[${time}]</span> ${message}`;
    this.container.prepend(div);
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
};

// Speech Utility
export const Speech = {
  synth: window.speechSynthesis,
  lastSpoken: 0,
  throttle: 2500,

  speak(text) {
    if (!text || !this.synth) return;
    const now = Date.now();
    if (now - this.lastSpoken < this.throttle) return;

    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    this.synth.speak(utterance);
    this.lastSpoken = now;
  }
};

// Geometry Utility
export const Geometry = {
  calculateDistance(pixelHeight, realHeightCm, focalLength) {
    if (pixelHeight === 0) return 0;
    return Math.round((realHeightCm * focalLength) / pixelHeight);
  }
};
