// src/components/PhotoInput.tsx
import { useState, useRef, useEffect } from 'react';
import CropOverlay from './CropOverlay';
import type { Photo } from '../App';

interface PhotoInputProps {
  onComplete: (photos: Photo[]) => void;
  onBack: () => void;
  mode: 'camera' | 'upload';
}

// --- STYLES ---

const timerOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'white',
  fontSize: '4rem',
  textShadow: '0 0 20px rgba(0,0,0,0.8)',
  fontFamily: "'Courier New', Courier, monospace",
  zIndex: 60, // Above freeze-frame
};

const flashOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'white',
  opacity: 1,
  zIndex: 100, // On top of everything
};

const freezeFrameStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  zIndex: 50, // Above video, below timer
};

// --- CROP OVERLAY LOGIC ---
// These values are from CanvasPreview.tsx to calculate the correct aspect ratio
const STRIP_WIDTH = (1050 - 40 * 3) / 2; // 465
const STRIP_AREA_HEIGHT = 1500 - 40 * 2; // 1420
const PHOTO_HEIGHT = (STRIP_AREA_HEIGHT - 20 * 3) / 4; // 340
const PHOTO_ASPECT_RATIO = STRIP_WIDTH / PHOTO_HEIGHT; // approx 1.3676


// --- COMPONENT ---

function PhotoInput({ onComplete, onBack, mode }: PhotoInputProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // New state for flash and freeze-frame
  const [flashActive, setFlashActive] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(
    null
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Effect 1: Setup camera (Unchanged)
  useEffect(() => {
    if (mode !== 'camera') return;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (window.isSecureContext === false) {
            setError(
              'Camera access is only available on secure (HTTPS) connections.'
            );
          } else {
            setError('Camera API is not supported by your browser.');
          }
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.oncanplay = () => {
            setIsCameraReady(true);
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setError('Camera permission was denied. Please allow camera access in your browser settings.');
        } else {
          setError('Could not access camera. Please check permissions and ensure you are on a secure (HTTPS) connection.');
        }
      }
    };
    startCamera();

    return () => cleanupStream();
  }, [mode]);

  // Effect 2: The Core Timer Engine (Updated)
  useEffect(() => {
    if (countdown === null) return; // Timer isn't active

    // At start of countdown, show live video
    if (countdown === 2) {
      videoRef.current?.play();
      setLastCapturedImage(null); // Clear freeze-frame
    }

    if (countdown > 0) {
      // Decrement the timer
      const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timerId);
    }

    // --- countdown === 0 ---
    if (!videoRef.current || !canvasRef.current) return;

    // Capture the image
    const captureImage = () => {
      const video = videoRef.current;
      if (!video) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');

      // Trigger flash and show freeze-frame
      setFlashActive(true);
      setLastCapturedImage(dataUrl);
      setTimeout(() => setFlashActive(false), 150);

      // Add the new photo to our state
      setPhotos(prevPhotos => [...prevPhotos, { src: dataUrl }]);
    };

    captureImage();
  }, [countdown]);

  // Effect 3: Complete and move to preview (Unchanged)
  useEffect(() => {
    if (photos.length === 4) {
      // All photos are taken, complete the process
      setTimeout(() => {
        onComplete(photos);
      }, 1000);
    } else if (photos.length > 0 && countdown === 0) {
      // A photo was just taken, but we're not done yet.
      // Pause for 1 second (showing freeze-frame), then start the next countdown.
      setTimeout(() => setCountdown(2), 1000);
    }
  }, [photos, onComplete]); // This effect now also depends on `countdown`

  // handleStartSequence (Unchanged)
  const handleStartSequence = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setCountdown(2);
    }
  };

  // --- File Upload Logic (Unchanged) ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      onBack();
      return;
    }
    const files = Array.from(event.target.files);
    const photoPromises = files.map((file) => {
      return new Promise<Photo>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) =>
          resolve({ src: e.target?.result as string, file });
        reader.readAsDataURL(file);
      });
    });
    Promise.all(photoPromises).then((newPhotos) => {
      setPhotos(newPhotos.slice(0, 4));
    });
  };

  const handleConfirm = () => {
    if (photos.length === 4) {
      onComplete(photos);
    }
  };

  const handleReselect = () => {
    setPhotos([]);
    fileInputRef.current?.click();
  };

  const hiddenFileInput = (
    <input
      type="file"
      ref={fileInputRef}
      multiple
      accept="image/*"
      onChange={handleFileChange}
      style={{ display: 'none' }}
    />
  );

  // --- RENDER ---

  // Camera view
  if (mode === 'camera') {
    return (
      <div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div style={{ position: 'relative', width: '100%' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              // Hide video if freeze-frame is active
              opacity: lastCapturedImage ? 0 : 1,
            }}
          />

        {/* Crop Overlay */}
        <CropOverlay aspectRatio={PHOTO_ASPECT_RATIO} />

          {/* Freeze Frame */}
          {lastCapturedImage && (
            <img
              src={lastCapturedImage}
              alt="Captured photo"
              style={freezeFrameStyle}
            />
          )}

          {/* Flash Overlay */}
          {flashActive && <div style={flashOverlayStyle} />}

          {/* Timer Overlay */}
          {countdown !== null && countdown > 0 && (
            <div style={timerOverlayStyle}>
              <h1 style={{ fontWeight: 'bold' }}>{countdown}</h1>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* --- Render Logic --- */}
        {!isCameraReady && <p>Loading camera...</p>}

        {isCameraReady && countdown === null && photos.length === 0 && (
          <button onClick={handleStartSequence} style={{ marginTop: '1rem' }}>
            Ready
          </button>
        )}

        {countdown !== null && (
          <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>
            Taking photo {photos.length + 1} of 4
          </p>
        )}

        {/* Show "Processing..." after 4th photo */}
        {photos.length === 4 && (
          <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>
            Processing...
          </p>
        )}

        <button onClick={onBack}>Cancel</button>
      </div>
    );
  }

  // Upload view
  if (mode === 'upload') {
    if (photos.length === 0) {
      return (
        <div>
          {hiddenFileInput}
          <p>Opening file selector...</p>
          <button onClick={onBack}>Cancel</button>
        </div>
      );
    }

    return (
      <div>
        {hiddenFileInput}
        <h2>Confirm Photos</h2>
        <p>{photos.length} photos selected.</p>
        <button onClick={handleReselect}>Reselect</button>
        {photos.length === 4 ? (
          <button onClick={handleConfirm}>Confirm</button>
        ) : (
          <p>Please select exactly 4 photos.</p>
        )}
        <button onClick={onBack}>Back to Home</button>
      </div>
    );
  }

  return null;
}

export default PhotoInput;