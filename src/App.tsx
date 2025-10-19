// src/App.tsx
import { useState } from 'react';
import PhotoInput from './components/PhotoInput';
import Editor from './components/Editor';
import CameraReadyModal from './components/CameraReadyModal';

export interface Photo {
  src: string;
  file?: File;
}

type View = 'home' | 'camera' | 'upload' | 'preview';

function App() {
  const [view, setView] = useState<View>('home');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false); // New state

  const handlePhotosSelected = (newPhotos: Photo[]) => {
    setPhotos(newPhotos);
    setView('preview');
  };

  const handleRestart = () => {
    setPhotos([]);
    setView('home');
  };

  // New handler to start the session from the modal
  const handleStartCameraSession = () => {
    setIsCameraModalOpen(false);
    setView('camera');
  };

  const renderView = () => {
    switch (view) {
      case 'camera':
        return (
          <PhotoInput
            mode="camera"
            onComplete={handlePhotosSelected}
            onBack={handleRestart}
          />
        );
      case 'upload':
        return (
          <PhotoInput
            mode="upload"
            onComplete={handlePhotosSelected}
            onBack={handleRestart}
          />
        );
      case 'preview':
        return <Editor photos={photos} onRestart={handleRestart} />;
      case 'home':
      default:
        return (
          <div>
            <h1>Photostrip</h1>
            <p>Create a 4-photo strip for an L-size print.</p>
            {/* This button now opens the modal */}
            <button onClick={() => setIsCameraModalOpen(true)}>
              Start Photobooth
            </button>
            <button onClick={() => setView('upload')}>Upload Photos</button>
          </div>
        );
    }
  };

  return (
    <div>
      {renderView()}

      {isCameraModalOpen && (
        <CameraReadyModal
          onStart={handleStartCameraSession}
          onCancel={() => setIsCameraModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;