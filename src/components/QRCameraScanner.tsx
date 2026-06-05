import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, Upload, Keyboard, RefreshCw, AlertCircle, Scan, Maximize2, AlertTriangle } from 'lucide-react';
import { db } from '../dbMock';

interface QRCameraScannerProps {
  onScanSuccess: (scannedValue: string) => void;
  onClose?: () => void;
}

export const QRCameraScanner: React.FC<QRCameraScannerProps> = ({
  onScanSuccess,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  
  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scanning, setScanning] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);

  // Manual/Upload State
  const [manualInput, setManualInput] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Detect available cameras on load
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, selectedCameraId]);

  const startCamera = async () => {
    setCameraError('');
    stopCamera();

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);

      const constraints: MediaStreamConstraints = {
        video: selectedCameraId 
          ? { deviceId: { exact: selectedCameraId } } 
          : { facingMode: 'environment' } // Prefer back camera on phones
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        videoRef.current.play();
        setScanning(true);
        // Start processing frames
        requestRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setCameraError(
        err.name === 'NotAllowedError' 
          ? 'Permission denied. Please grant camera access in your browser settings.' 
          : 'Could not connect to camera. Please make sure no other app is using it.'
      );
      setScanning(false);
    }
  };

  const stopCamera = () => {
    setScanning(false);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const scanFrame = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) {
      requestRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      // Set canvas to match video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw active video frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Extract pixel buffer
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        // Success! Log and callbacks
        stopCamera();
        onScanSuccess(code.data);
        return; // stop requesting frames
      }
    }

    requestRef.current = requestAnimationFrame(scanFrame);
  };

  // Image Upload Decrypting
  const handleImageFile = (file: File) => {
    setUploadError('');
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file (PNG/JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            onScanSuccess(code.data);
          } else {
            setUploadError("Could not find a valid QR Code in this image. Ensure the code is clear and well-lit.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScanSuccess(manualInput.trim());
    }
  };

  // Simulated click triggers to easily scan book/chapter/resource
  const books = db.getTextbooks();
  const chapters = db.getChapters();
  const resources = db.getResources();

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden w-full max-w-md mx-auto">
      {/* Header */}
      <div className="bg-slate-900 px-5 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Scan className="w-5 h-5 text-emerald-400 animate-pulse" />
          <h3 className="font-bold text-base tracking-tight text-slate-100">Scan QR Code Sensor</h3>
        </div>
        {onClose && (
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition text-xs border border-slate-700 rounded-md px-2 py-1"
          >
            Close
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 gap-1">
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'camera'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Device Camera</span>
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'upload'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Image</span>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'manual'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          <span>Manual Code</span>
        </button>
      </div>

      <div className="p-5">
        {/* CAMERA SCANNING TAB */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            {cameraError ? (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                <div className="space-y-1">
                  <p className="font-semibold select-none">Camera Connection Hint</p>
                  <p className="text-slate-600 leading-relaxed">{cameraError}</p>
                  <p className="text-slate-500 italic mt-2">
                    Tip: If running inside AI Studio preview frames, hardware camera integration may be block-restricted. Try the <strong>Upload Image</strong> tab or <strong>Demo Card Tap</strong> shortcuts below!
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-900 shadow-inner flex flex-col items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(1)' }}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Laser scan line effect */}
                {scanning && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-bounce" style={{ animationDuration: '3s' }} />
                )}

                {/* Center Scan Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-40 border-2 border-dashed border-emerald-400/80 rounded-xl flex items-center justify-center">
                    <div className="w-36 h-36 bg-emerald-500/5 rounded-lg border border-emerald-500/10" />
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 pointer-events-none">
                  <span className="flex items-center gap-1.5 text-[10px] text-emerald-300 font-mono">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    LIVE SCANNER ACTIVE
                  </span>
                </div>
              </div>
            )}

            {/* Camera Select dropdown */}
            {cameras.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Select Lens:</span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg text-slate-700 outline-hidden flex-1"
                >
                  {cameras.map((device, idx) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={startCamera}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* IMAGE UPLOAD TAB */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <Upload className={`w-8 h-8 mb-3 transition ${dragActive ? 'text-emerald-500' : 'text-slate-400'}`} />
              <p className="text-xs text-slate-700 font-semibold mb-1">
                Drag textbook QR image here
              </p>
              <p className="text-[11px] text-slate-400 mb-4">
                Supports PNG, JPG, or SVG
              </p>
              <label className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-lg cursor-pointer transition select-none shadow-sm">
                Choose Image File
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        )}

        {/* MANUAL PATH TAB */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">QR Code Encoded Content:</label>
              <input
                type="text"
                placeholder="e.g. book-math-8 OR ch-math8-1"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition shadow-sm"
            >
              Analyze Code Path
            </button>
          </form>
        )}

        {/* QUICK DEMO CARDS (The Smart Selection Helper) */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 mb-3 text-slate-800">
            <Scan className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">Demo Interactive QR Tap Cards</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
            Since you are testing in a live web browser, click any button below to mock a physical sticker scan perfectly!
          </p>
          <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
            {books.map(book => (
              <button
                key={book.id}
                type="button"
                onClick={() => onScanSuccess(book.id)}
                className="p-2 border border-slate-200 text-left hover:border-emerald-500 hover:bg-emerald-50/20 rounded-lg transition-all group"
              >
                <div className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-700 truncate">{book.title}</div>
                <div className="text-[9px] text-slate-400 mt-0.5 flex justify-between">
                  <span>Code: {book.id}</span>
                  <span className="font-semibold text-emerald-600">Scan Book</span>
                </div>
              </button>
            ))}
            {chapters.slice(0, 4).map(ch => (
              <button
                key={ch.id}
                type="button"
                onClick={() => onScanSuccess(ch.id)}
                className="p-2 border border-slate-200 text-left hover:border-emerald-500 hover:bg-emerald-50/20 rounded-lg transition-all group"
              >
                <div className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-700 truncate">Ch {ch.chapter_number}: {ch.chapter_name}</div>
                <div className="text-[9px] text-slate-400 mt-0.5 flex justify-between">
                  <span>Code: {ch.id}</span>
                  <span className="font-semibold text-emerald-600">Scan Chapter</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
