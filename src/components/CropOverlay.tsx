// src/components/CropOverlay.tsx
import { useMemo } from 'react';

interface CropOverlayProps {
  /** The aspect ratio of the inner, clear area (width / height) */
  aspectRatio: number;
}

const overlayContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none', // Allow clicks to pass through
  zIndex: 55,
};

const overlayPartStyle: React.CSSProperties = {
  position: 'absolute',
  background: 'rgba(0, 0, 0, 0.6)', // 60% opaque black
};

function CropOverlay({ aspectRatio }: CropOverlayProps) {
  // We need to know the aspect ratio of the container (the video feed)
  // to correctly calculate the overlay bars. Since the video has `width: 100%`,
  // its aspect ratio is determined by its parent's width and its own height.
  // For simplicity and robustness, we'll assume a common 16:9 or similar wide aspect ratio
  // for the container. This logic determines if the final crop area is limited by
  // the container's width or its height.
  const containerAspectRatio = 16 / 9;

  const styles = useMemo(() => {
    if (containerAspectRatio > aspectRatio) {
      // Container is wider than the target crop area.
      // The crop area will fill the full height.
      const relativeWidth = (aspectRatio / containerAspectRatio) * 100;
      const barWidth = (100 - relativeWidth) / 2;
      return {
        left: { ...overlayPartStyle, left: 0, top: 0, bottom: 0, width: `${barWidth}%` },
        right: { ...overlayPartStyle, right: 0, top: 0, bottom: 0, width: `${barWidth}%` },
        top: null,
        bottom: null,
      };
    } else {
      // Container is taller than or same as the target crop area.
      // The crop area will fill the full width.
      const relativeHeight = (containerAspectRatio / aspectRatio) * 100;
      const barHeight = (100 - relativeHeight) / 2;
      return {
        top: { ...overlayPartStyle, top: 0, left: 0, right: 0, height: `${barHeight}%` },
        bottom: { ...overlayPartStyle, bottom: 0, left: 0, right: 0, height: `${barHeight}%` },
        left: null,
        right: null,
      };
    }
  }, [aspectRatio]);

  return (
    <div style={overlayContainerStyle}>
      {styles.top && <div style={styles.top} />}
      {styles.bottom && <div style={styles.bottom} />}
      {styles.left && <div style={styles.left} />}
      {styles.right && <div style={styles.right} />}
    </div>
  );
}


export default CropOverlay;