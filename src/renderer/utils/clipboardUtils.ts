/**
 * Purpose: Utility functions for checking the clipboard for image data and retrieving dimensions.
 */
export const getClipboardImageDimensions = async (): Promise<{
  width: number;
  height: number;
} | null> => {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      if (item.types.includes("image/png")) {
        const blob = await item.getType("image/png");
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = () => resolve(null);
          img.src = URL.createObjectURL(blob);
        });
      }
    }
  } catch (err) {
    console.error("Failed to read clipboard:", err);
  }
  return null;
};
