// src/components/CameraReadyModal.tsx

interface CameraReadyModalProps {
  onStart: () => void;
  onCancel: () => void;
}

function CameraReadyModal({ onStart, onCancel }: CameraReadyModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Get Ready!</h2>
        <p>You'll have 5 seconds for each photo. 4 photos in total.</p>
        <button onClick={onStart}>START</button>
        <button onClick={onCancel} style={{ background: '#777' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default CameraReadyModal;