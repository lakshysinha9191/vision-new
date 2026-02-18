// js/main.js
import { Logger, Speech, CONFIG, Geometry } from './utils.js';
import { VisionEngine } from './vision.js';

class AppController {
  constructor() {
    // State
    this.isRunning = false;
    this.isVisionOn = false;
    this.isMuted = false;

    // Elements
    this.video = document.getElementById('videoElement');
    this.canvas = document.getElementById('overlayCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Engine
    this.vision = new VisionEngine();
    
    // Init
    this.initUI();
    Logger.init('logContainer');
  }

  initUI() {
    // Button Bindings
    document.getElementById('btnStart').addEventListener('click', () => this.startSystem());
    document.getElementById('btnToggleVision').addEventListener('click', () => this.toggleVision());
    document.getElementById('btnToggleAudio').addEventListener('click', () => this.toggleAudio());
    document.getElementById('btnScan').addEventListener('click', () => this.manualScan());
    document.getElementById('btnClearLog').addEventListener('click', () => {
      document.getElementById('logContainer').innerHTML = '';
    });

    // Window Resize
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  async startSystem() {
    const overlay = document.getElementById('initOverlay');
    overlay.innerHTML = '<div class="init-content"><h2>Calibrating...</h2><p>Initializing Camera & AI Models.</p></div>';

    try {
      // 1. Camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      this.video.srcObject = stream;
      await this.video.play();

      // 2. Canvas Setup
      this.resizeCanvas();

      // 3. AI Engine
      await this.vision.initialize(this.video);

      // 4. UI Updates
      overlay.classList.add('hidden');
      this.video.classList.add('active');
      document.getElementById('statusText').textContent = 'System Online';
      document.querySelector('.status-dot').classList.add('active');
      
      Logger.log('System Initialization Complete.', 'success');
      Speech.speak('System Online. Ready to scan.');
      
      this.isRunning = true;
      
      // Start Render Loop
      this.loop();

    } catch (err) {
      overlay.innerHTML = `<div class="init-content"><h2>Error</h2><p>${err.message}</p></div>`;
      Logger.log(`Startup Failed: ${err.message}`, 'error');
    }
  }

  resizeCanvas() {
    const rect = this.video.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  toggleVision() {
    this.isVisionOn = !this.isVisionOn;
    const btn = document.getElementById('btnToggleVision');
    btn.textContent = this.isVisionOn ? 'Vision: ON' : 'Vision: OFF';
    btn.classList.toggle('active', this.isVisionOn);
    Logger.log(this.isVisionOn ? 'Continuous Vision ON' : 'Continuous Vision OFF', 'info');
  }

  toggleAudio() {
    this.isMuted = !this.isMuted;
    const btn = document.getElementById('btnToggleAudio');
    btn.textContent = this.isMuted ? 'Audio: OFF' : 'Audio: ON';
    btn.classList.toggle('active', !this.isMuted);
    Logger.log(this.isMuted ? 'Audio Muted' : 'Audio Enabled', 'info');
  }

  async manualScan() {
    if(!this.isRunning) return;
    Logger.log('Manual Scan Triggered', 'info');
    await this.processFrame(true);
  }

  // Main Loop
  loop() {
    if (!this.isRunning) return;

    if (this.isVisionOn) {
      this.processFrame(false);
    }
    
    requestAnimationFrame(() => this.loop());
  }

  async processFrame(forced = false) {
    // Detect Objects
    const predictions = await this.vision.detect();
    
    // Clear Canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (predictions && predictions.length > 0) {
      // Get the best prediction (largest area usually)
      const best = predictions.sort((a, b) => (b.bbox[2] * b.bbox[3]) - (a.bbox[2] * a.bbox[3]))[0];
      
      await this.renderPrediction(best, forced);
    } else {
      document.getElementById('objectName').textContent = 'No Object';
      document.getElementById('objectDistance').textContent = '-- cm';
    }
  }

  async renderPrediction(pred, speakEnabled) {
    const [x, y, width, height] = pred.bbox;
    
    // 1. Calculate Distance
    const realHeight = CONFIG.knownHeights[pred.class] || CONFIG.defaultHeight;
    const distance = Geometry.calculateDistance(height, realHeight, CONFIG.focalLength);

    // 2. UI Updates
    document.getElementById('objectName').textContent = pred.class;
    document.getElementById('objectScore').textContent = `${Math.round(pred.score * 100)}%`;
    document.getElementById('objectDistance').textContent = `${distance} cm`;

    // 3. Draw Bounding Box
    this.ctx.strokeStyle = '#00f2ff';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x, y, width, height);
    
    // Draw Label
    this.ctx.fillStyle = 'rgba(0, 242, 255, 0.1)';
    this.ctx.fillRect(x, y, width, 30);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.fillText(`${pred.class} | ${distance}cm`, x + 10, y + 22);

    // 4. OCR & Speech (Only if forced or auto is on, throttled)
    if (speakEnabled || this.isVisionOn) {
      // Only OCR the top detected object region to save performance
      const text = await this.vision.recognizeText(x, y, width, height);
      
      if (text) {
        document.getElementById('ocrText').textContent = text;
        // Draw OCR box overlay
        this.ctx.strokeStyle = '#00ff9d';
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.setLineDash([]);
        
        if (!this.isMuted) {
          const speechText = text.length > 0 
            ? `That is a ${pred.class} at ${distance} centimeters. It reads: ${text}`
            : `That is a ${pred.class} at ${distance} centimeters.`;
          Speech.speak(speechText);
        }
      } else {
         if (!this.isMuted && speakEnabled) Speech.speak(`That is a ${pred.class}. No text found.`);
      }
    }
  }
}

// Bootstrap App
const app = new AppController();
