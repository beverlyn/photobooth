// src/components/Editor.tsx
import { useRef } from 'react';
import type { Photo } from '../App';
import CanvasPreview, { type CanvasPreviewHandle } from './CanvasPreview';

interface EditorProps {
  photos: Photo[];
  onRestart: () => void;
}

function Editor({ photos, onRestart }: EditorProps) {
  // Create a ref for the canvas component
  const canvasRef = useRef<CanvasPreviewHandle>(null);

  const handleDownload = () => {
    // Call the download method on the child component
    canvasRef.current?.downloadImage();
  };

  // Ensure we only pass 4 photos
  const photosForStrip = photos.slice(0, 4);

  return (
    <div>
      <h2>Your Photostrip</h2>
      <p>Here is your print-ready L-size (89x127mm) image.</p>
      
      <CanvasPreview ref={canvasRef} photos={photosForStrip} />
      
      <button onClick={handleDownload} style={{ marginTop: '1rem' }}>
        Download Image
      </button>
      <button onClick={onRestart} style={{ marginTop: '1rem' }}>
        Start Over
      </button>
    </div>
  );
}

export default Editor;