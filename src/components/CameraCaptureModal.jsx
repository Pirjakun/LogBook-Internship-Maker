'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, SwitchCamera } from 'lucide-react';

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedImage]);

  const startCamera = async () => {
    setErrorMsg('');
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan pada browser Anda.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (!capturedImage) return;

    // Convert dataURL to File object
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `kamera_logbook_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file, capturedImage);
        onClose();
        setCapturedImage(null);
      });
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content camera-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            <Camera style={{ width: 20, height: 20, display: 'inline', marginRight: 8 }} />
            Ambil Foto dari Kamera
          </h3>
          <button onClick={onClose} className="btn-icon" aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        <div className="camera-body">
          {errorMsg ? (
            <div className="camera-error">
              <p>{errorMsg}</p>
              <button onClick={startCamera} className="btn btn-secondary mt-2">
                <RefreshCw size={16} /> Coba Lagi
              </button>
            </div>
          ) : capturedImage ? (
            <div className="camera-preview-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="Hasil Foto" className="camera-preview-img" />
            </div>
          ) : (
            <div className="camera-view-container">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="camera-video"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              <button 
                type="button" 
                onClick={toggleFacingMode}
                className="btn-switch-camera"
                title="Ganti Kamera"
              >
                <SwitchCamera size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {capturedImage ? (
            <>
              <button onClick={handleRetake} className="btn btn-secondary">
                <RefreshCw size={16} /> Foto Ulang
              </button>
              <button onClick={handleConfirm} className="btn btn-primary">
                <Check size={16} /> Gunakan Foto Ini
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="btn btn-secondary">
                Batal
              </button>
              <button 
                onClick={takePhoto} 
                disabled={Boolean(errorMsg)} 
                className="btn btn-primary btn-capture"
              >
                <Camera size={18} /> Ambil Foto
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
