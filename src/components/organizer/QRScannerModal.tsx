import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Camera,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  QrCode,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Upload,
  Sparkles,
  Zap
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
  isProcessing?: boolean;
}

/**
 * Standards-compliant QR Code Scanner Modal Component for Festofy Gate Check-in.
 * Powered by standard QR decoding engines (html5-qrcode & jsQR).
 * Features:
 * - Camera permission verification & graceful error handling
 * - Automatic rear (environment) camera selection
 * - Live camera preview with animated scanning laser reticle
 * - Visual feedback on scan success (green checkmark, badge, acoustic chime)
 * - Visual feedback on scan failure / unreadable QR
 * - Optional image upload fallback powered by Html5Qrcode
 * - Clean resource disposal (stops MediaStream tracks & frees hardware)
 */
export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  onScanFailure,
  isProcessing = false
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const [cameraState, setCameraState] = useState<'initializing' | 'active' | 'denied' | 'unavailable' | 'insecure'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [isDecodingFile, setIsDecodingFile] = useState(false);

  // Play subtle acoustic confirmation beep on successful scan
  const playAudioFeedback = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch {
      // Audio playback is optional; continue silently if restricted
    }
  }, []);

  // Stop camera stream safely and release all hardware resources
  const stopCameraStream = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Notice stopping camera track:', e);
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {});
        }
      } catch {
        // html5-qrcode instance cleanup safe
      }
    }
  }, []);

  // Handle successful QR detection with visual and audio feedback
  const handleDetectedCode = useCallback((detectedText: string) => {
    const trimmed = detectedText.trim();
    if (!trimmed) return;

    stopCameraStream();
    setScannedResult(trimmed);
    setScanError(null);
    playAudioFeedback();

    // Give user brief visual feedback of successful capture before closing
    setTimeout(() => {
      onScanSuccess(trimmed);
    }, 450);
  }, [onScanSuccess, playAudioFeedback, stopCameraStream]);

  // Request camera permissions and start continuous scanning
  const startCamera = useCallback(async () => {
    stopCameraStream();
    setErrorMessage(null);
    setScanError(null);
    setScannedResult(null);
    setCameraState('initializing');

    // 1. Check for mediaDevices support (requires secure context HTTPS or localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isSecure = window.isSecureContext;
      if (!isSecure) {
        setCameraState('insecure');
        setErrorMessage('Camera access requires a secure connection (HTTPS or localhost). Please use manual ticket lookup or connect over HTTPS.');
      } else {
        setCameraState('unavailable');
        setErrorMessage('Camera media devices are not supported on this browser.');
      }
      return;
    }

    try {
      // 2. Try rear/environment camera first, fall back to any video device
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (err: any) {
        console.warn('Ideal environment camera constraint failed, falling back to default video:', err);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari

      await videoRef.current.play();
      setCameraState('active');

      // 3. Start scanning loop
      const scanLoop = () => {
        if (!videoRef.current || !canvasRef.current || isProcessing) {
          animationFrameRef.current = requestAnimationFrame(scanLoop);
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            });

            if (code && code.data && code.data.trim()) {
              handleDetectedCode(code.data.trim());
              return;
            }
          }
        }

        animationFrameRef.current = requestAnimationFrame(scanLoop);
      };

      animationFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err: any) {
      console.warn('Camera request error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('denied');
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser address bar to scan QR codes, or use manual ticket code lookup.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraState('unavailable');
        setErrorMessage('No camera was detected on this device. You can verify passes using the manual ticket lookup bar or upload a pass image.');
      } else {
        setCameraState('unavailable');
        setErrorMessage(err.message || 'Unable to access the camera stream. Please try again or use manual lookup.');
      }
    }
  }, [handleDetectedCode, isProcessing, stopCameraStream]);

  // Image file QR scanning via html5-qrcode
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingFile(true);
    setScanError(null);

    try {
      const containerId = 'festofy-html5-qr-scanner-element';
      let html5QrCode = html5QrCodeRef.current;
      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode(containerId);
        html5QrCodeRef.current = html5QrCode;
      }

      const decodedText = await html5QrCode.scanFile(file, false);
      if (decodedText && decodedText.trim()) {
        handleDetectedCode(decodedText.trim());
      } else {
        const msg = 'No valid QR code was detected in the uploaded image.';
        setScanError(msg);
        if (onScanFailure) onScanFailure(msg);
      }
    } catch (err: any) {
      console.warn('html5-qrcode scanFile error:', err);
      const msg = 'Could not read a QR code from this image. Please ensure the pass QR code is clearly visible and well-lit.';
      setScanError(msg);
      if (onScanFailure) onScanFailure(msg);
    } finally {
      setIsDecodingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Lifecycle control: initialize on open, cleanup on close/unmount
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, startCamera, stopCameraStream]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
    >
      {/* Invisible Canvas for Frame Processing */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Hidden element for html5-qrcode library integration */}
      <div id="festofy-html5-qr-scanner-element" className="hidden" aria-hidden="true" />

      {/* Hidden File Input for Image Scan Fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md mx-auto rounded-3xl bg-[#14161a] border border-[#2e3442] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#242730] flex items-center justify-between gap-3 bg-[#181a20]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ff4f1a]/15 text-[#ff4f1a] flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 id="qr-scanner-title" className="font-heading text-sm font-bold text-white flex items-center gap-2">
                <span>Fast-Track Gate QR Scanner</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#ff4f1a]/20 text-[#ff4f1a]">
                  HTML5
                </span>
              </h2>
              <span className="text-[11px] text-[#9da3b4] block">
                Point camera at attendee pass or upload pass photo
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-[#9da3b4] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close QR scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewport / State Container */}
        <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
          {/* Active Video Stream */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${cameraState === 'active' ? 'block' : 'hidden'}`}
          />

          {/* Scanner Guide Overlay with Animated Reticle */}
          {cameraState === 'active' && !scannedResult && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
              {/* Dimmed surrounding mask */}
              <div className="relative w-64 h-64 border-2 border-[#ff4f1a] rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] flex flex-col justify-between p-2">
                {/* Corner guide accents */}
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-white -mt-1 -ml-1 rounded-tl" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-white -mt-1 -mr-1 rounded-tr" />
                </div>

                {/* Animated Horizontal Laser Scan Line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#ff4f1a] to-transparent animate-pulse my-auto shadow-[0_0_8px_#ff4f1a]" />

                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-white -mb-1 -ml-1 rounded-bl" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-white -mb-1 -mr-1 rounded-br" />
                </div>
              </div>

              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="px-3 py-1 rounded-full bg-black/75 text-[11px] font-mono text-zinc-300 backdrop-blur-md border border-white/10">
                  Align pass QR inside the square
                </span>
              </div>
            </div>
          )}

          {/* Initializing / Loading Camera State */}
          {cameraState === 'initializing' && (
            <div className="flex flex-col items-center justify-center p-6 space-y-3 text-center">
              <RefreshCw className="w-8 h-8 text-[#ff4f1a] animate-spin" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-white">Opening camera stream...</p>
                <p className="text-[11px] text-[#9da3b4] max-w-xs">
                  Requesting camera permissions for gate check-in scanning.
                </p>
              </div>
            </div>
          )}

          {/* Camera Permission Denied State */}
          {cameraState === 'denied' && (
            <div className="flex flex-col items-center justify-center p-6 space-y-3 text-center max-w-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-sm font-bold text-white">Camera Access Denied</h3>
                <p className="text-xs text-[#9da3b4] leading-relaxed">
                  {errorMessage || 'Camera access was denied. Please allow permissions in your browser or use manual ticket lookup.'}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-2 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Permission</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-[#ff4f1a]/20 hover:bg-[#ff4f1a]/30 border border-[#ff4f1a]/40 text-xs font-semibold text-[#ff4f1a] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Pass</span>
                </button>
              </div>
            </div>
          )}

          {/* Camera Unavailable / Insecure State */}
          {(cameraState === 'unavailable' || cameraState === 'insecure') && (
            <div className="flex flex-col items-center justify-center p-6 space-y-3 text-center max-w-xs">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-sm font-bold text-white">
                  {cameraState === 'insecure' ? 'HTTPS Required for Camera' : 'Camera Unavailable'}
                </h3>
                <p className="text-xs text-[#9da3b4] leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-4 py-2 rounded-xl bg-[#ff4f1a] hover:bg-[#ff6838] text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Pass Image Instead</span>
              </button>
            </div>
          )}

          {/* Failed Scan / Unreadable QR Visual Feedback Alert */}
          {scanError && (
            <div className="absolute top-4 left-4 right-4 z-20 p-3 rounded-2xl bg-red-950/90 border border-red-500/50 backdrop-blur-md text-xs text-red-200 flex items-start gap-2.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">Scan Unsuccessful</p>
                <p className="text-[11px] text-red-300 mt-0.5 leading-relaxed">{scanError}</p>
              </div>
              <button
                type="button"
                onClick={() => setScanError(null)}
                className="text-red-400 hover:text-white shrink-0 p-1 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Decoding File Progress State */}
          {isDecodingFile && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 space-y-3 text-center z-30">
              <RefreshCw className="w-8 h-8 text-[#ff4f1a] animate-spin" />
              <p className="text-xs font-semibold text-white">Analyzing pass image with html5-qrcode...</p>
            </div>
          )}

          {/* Successful Scan Feedback */}
          {scannedResult && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 space-y-3 text-center animate-in zoom-in-95 duration-150 z-30 border-2 border-emerald-500/50">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold tracking-wider uppercase">
                  <Sparkles className="w-3 h-3" />
                  <span>Scan Verified</span>
                </div>
                <h3 className="font-heading text-sm font-bold text-white">QR Code Captured!</h3>
                <p className="text-xs font-mono text-[#ff4f1a] truncate max-w-xs px-2 font-bold bg-[#191b20] py-1 rounded-lg border border-[#2e3442]">
                  {scannedResult}
                </p>
              </div>
              <span className="text-[11px] text-[#9da3b4] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Checking organization authorization...</span>
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#14161a] border-t border-[#242730] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Upload an image of a festival pass to decode"
            >
              <Upload className="w-3.5 h-3.5 text-[#ff4f1a]" />
              <span>Upload Image</span>
            </button>
            <span className="text-[#656c80] text-[11px] font-mono hidden sm:inline">
              Rear camera
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#191b20] hover:bg-[#252830] border border-[#2e3442] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
