/**
 * Purpose: Utility functions for image manipulation and optimization, such as calculating bounding boxes for non-transparent pixels.
 */
/**
 * Finds the bounding box of non-transparent pixels
 * WITHIN a specific search area for optimization.
 */
export function getOptimizedBoundingBox(
  canvas: HTMLCanvasElement,
  searchBounds: { x: number; y: number; width: number; height: number },
) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const { x, y, width, height } = searchBounds;

  const searchX = Math.max(0, Math.floor(x));
  const searchY = Math.max(0, Math.floor(y));
  const searchWidth = Math.min(canvas.width - searchX, Math.ceil(width));
  const searchHeight = Math.min(canvas.height - searchY, Math.ceil(height));

  if (searchWidth <= 0 || searchHeight <= 0) return null;

  const data = ctx.getImageData(searchX, searchY, searchWidth, searchHeight).data;
  let minX = canvas.width,
    minY = canvas.height,
    maxX = -1,
    maxY = -1;
  let foundPixel = false;

  for (let dy = 0; dy < searchHeight; dy++) {
    for (let dx = 0; dx < searchWidth; dx++) {
      const alpha = data[(dy * searchWidth + dx) * 4 + 3];
      if (alpha > 0) {
        const globalX = searchX + dx;
        const globalY = searchY + dy;
        minX = Math.min(minX, globalX);
        minY = Math.min(minY, globalY);
        maxX = Math.max(maxX, globalX);
        maxY = Math.max(maxY, globalY);
        foundPixel = true;
      }
    }
  }

  if (!foundPixel) return null;

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

/**
 * Reduces the number of colors in ImageData based on quality (0-1).
 * Simulates PNG color palette reduction (quantization).
 */
export function quantizeImageData(imageData: ImageData, quality: number) {
  if (quality >= 1) return imageData;

  const data = imageData.data;
  // quality 1.0 -> 8 bits per channel (256 levels)
  // quality 0.1 -> 1 bit per channel (2 levels)
  // Linear mapping for simplicity, but could be adjusted for better "feel"
  const bitsPerChannel = Math.max(1, Math.min(8, Math.round(1 + quality * 7)));
  const levels = Math.pow(2, bitsPerChannel);
  const factor = 255 / (levels - 1);

  for (let i = 0; i < data.length; i += 4) {
    // Quantize R, G, B channels
    data[i] = Math.round(Math.round(data[i] / factor) * factor);
    data[i + 1] = Math.round(Math.round(data[i + 1] / factor) * factor);
    data[i + 2] = Math.round(Math.round(data[i + 2] / factor) * factor);
    // Alpha is usually kept for transparency quality
  }

  return imageData;
}
