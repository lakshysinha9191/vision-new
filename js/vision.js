// js/vision.js
import { CONFIG, Logger } from './utils.js';

export class VisionEngine {
  constructor() {
    this.model = null;
    this.videoElement = null;
    this.isReady = false;
  }

  async initialize(videoEl) {
    this.videoElement = videoEl;
    try {
      Logger.log('Loading TensorFlow Models...', 'info');
      // Load COCO-SSD
      this.model = await cocoSsd.load();
      this.isReady = true;
      Logger.log('AI Model Loaded Successfully.', 'success');
      return true;
    } catch (err) {
      Logger.log(`Model Load Error: ${err.message}`, 'error');
      return false;
    }
  }

  // Core Detection Method
  async detect() {
    if (!this.isReady || !this.videoElement) return null;

    const predictions = await this.model.detect(this.videoElement);
    if (!predictions || predictions.length === 0) return null;

    // Filter by score
    const valid = predictions.filter(p => p.score >= CONFIG.minScore);
    return valid.length > 0 ? valid : null;
  }

  // Text Recognition (OCR) using Tesseract
  async recognizeText(x, y, width, height) {
    if (!this.videoElement) return "";

    // Create temp canvas for crop
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');

    // Draw cropped area
    ctx.drawImage(
      this.videoElement, 
      x, y, width, height, 
      0, 0, width, height
    );

    try {
      const result = await Tesseract.recognize(tempCanvas, 'eng', { 
        logger: m => {} // Silence logs
      });
      return result.data.text.trim();
    } catch (e) {
      return "";
    }
  }
}
