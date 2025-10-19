// src/components/CanvasPreview.tsx
import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { Photo } from '../App';

// --- Constants ---
const CANVAS_WIDTH = 1050;
const CANVAS_HEIGHT = 1500;

interface CanvasPreviewProps {
  photos: Photo[]; // Will always be 4 photos
}

// Define the handle that will be exposed via the ref
export interface CanvasPreviewHandle {
  downloadImage: () => void;
}

// Use forwardRef to allow the parent component (Editor) to get a ref to this
const CanvasPreview = forwardRef<CanvasPreviewHandle, CanvasPreviewProps>(
  ({ photos }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Expose the downloadImage function to the parent component
    useImperativeHandle(ref, () => ({
      downloadImage() {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Create a link element to trigger the download
        const link = document.createElement('a');
        link.download = 'photostrip.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.9); // 90% quality JPG
        link.click();
      },
    }));

    useEffect(() => {
      let isMounted = true;
      const canvas = canvasRef.current;
      if (!canvas || photos.length !== 4) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Load all 4 images
      const imagePromises = photos.map((photo) => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          // Handle potential EXIF orientation issues from uploads
          img.crossOrigin = 'anonymous'; 
          img.src = photo.src;
          img.onload = () => resolve(img);
          img.onerror = reject;
        });
      });

      Promise.all(imagePromises)
        .then((images) => {
          if (!isMounted || !ctx) return; // Check if component is still mounted
          // Clear canvas with a white background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

          // Draw the layout
          drawDuplicatedStrips(ctx, images);
        })
        .catch((err) => console.error('Error loading images for canvas', err));

      return () => {
        isMounted = false; // Cleanup function to set mounted state to false
      };
    }, [photos]);

    return (
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ width: '100%', height: 'auto', border: '1px solid #ccc' }}
      />
    );
  }
);

// --- Drawing Logic Functions ---

function drawDuplicatedStrips(
  ctx: CanvasRenderingContext2D,
  images: HTMLImageElement[]
) {
  // Define layout padding
  const PADDING = 40; // Outer padding and space between strips
  const PHOTO_PADDING = 20; // Padding between photos in a strip

  // Calculate dimensions
  const STRIP_WIDTH = (CANVAS_WIDTH - PADDING * 3) / 2;
  const STRIP_AREA_HEIGHT = CANVAS_HEIGHT - PADDING * 2;
  const PHOTO_HEIGHT =
    (STRIP_AREA_HEIGHT - PHOTO_PADDING * (images.length - 1)) / images.length;

  // X positions for the two strips
  const x1 = PADDING;
  const x2 = PADDING * 2 + STRIP_WIDTH;
  const y = PADDING;

  // Draw Left Strip
  images.forEach((img, index) => {
    const photoY = y + index * (PHOTO_HEIGHT + PHOTO_PADDING);
    drawImageCover(ctx, img, x1, photoY, STRIP_WIDTH, PHOTO_HEIGHT);
  });

  // Draw Right Strip (identical)
  images.forEach((img, index) => {
    const photoY = y + index * (PHOTO_HEIGHT + PHOTO_PADDING);
    drawImageCover(ctx, img, x2, photoY, STRIP_WIDTH, PHOTO_HEIGHT);
  });
}

/**
 * Utility function to draw an image to fill a container, cropping it to fit (object-fit: cover).
 * This function is unchanged from Phase 2.
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.width / img.height;
  const containerRatio = w / h;
  let sx, sy, sWidth, sHeight;

  if (imgRatio > containerRatio) {
    // Image is wider than container
    sHeight = img.height;
    sWidth = sHeight * containerRatio;
    sx = (img.width - sWidth) / 2;
    sy = 0;
  } else {
    // Image is taller than or equal to container
    sWidth = img.width;
    sHeight = sWidth / containerRatio;
    sx = 0;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
}

export default CanvasPreview;