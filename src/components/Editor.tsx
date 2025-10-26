// src/components/Editor.tsx
import { useRef, useState } from 'react';
import type { Photo } from '../App';
import CanvasPreview, { type CanvasPreviewHandle } from './CanvasPreview';

interface EditorProps {
  photos: Photo[];
  onRestart: () => void;
}

type Filter = 'color' | 'sepia' | 'b&w';

function Editor({ photos, onRestart }: EditorProps) {
  const [filter, setFilter] = useState<Filter>('color');

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
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Filter:</strong>
        <button onClick={() => setFilter('color')} disabled={filter === 'color'} style={{ marginLeft: '0.5rem' }}>
          Color
        </button>
        <button onClick={() => setFilter('sepia')} disabled={filter === 'sepia'} style={{ marginLeft: '0.5rem' }}>
          Sepia
        </button>
        <button onClick={() => setFilter('b&w')} disabled={filter === 'b&w'} style={{ marginLeft: '0.5rem' }}>
          B&W
        </button>
      </div>

      <CanvasPreview
        ref={canvasRef}
        photos={photosForStrip}
        filter={filter}
      />

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