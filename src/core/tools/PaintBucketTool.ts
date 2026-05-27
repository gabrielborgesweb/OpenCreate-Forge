/**
 * Purpose: Implementation of the Paint Bucket tool for filling areas with color based on tolerance and contiguity.
 */
import { BaseTool, ToolContext, ToolId } from "./BaseTool";
import { createHistoryState, HistoryState } from "@/renderer/store/projectStore";
import { useUIStore } from "@store/uiStore";

export class PaintBucketTool extends BaseTool {
  id: ToolId = "paintBucket";

  private historySnapshot: HistoryState | null = null;

  onMouseDown(e: MouseEvent, context: ToolContext): void {
    if (e.button !== 0) return;

    const activeLayerId = context.project.activeLayerId;
    if (!activeLayerId) return;

    if (context.isLayerLocked(activeLayerId) || !context.isLayerVisible(activeLayerId)) return;

    const layer = context.project.layers.find((l) => l.id === activeLayerId);
    if (!layer) return;

    if (layer.type !== "raster") {
      useUIStore.getState().showToast("Cannot fill on a non-raster layer", "warning");
      return;
    }

    const { x, y } = context.screenToProject(e.offsetX, e.offsetY);
    const clickX = Math.floor(x);
    const clickY = Math.floor(y);

    // Check if click is within layer bounds
    if (
      clickX < layer.x ||
      clickX >= layer.x + layer.width ||
      clickY < layer.y ||
      clickY >= layer.y + layer.height
    ) {
      // If we clicked outside, we might still want to fill if we're creating a new layer or something,
      // but usually Paint Bucket works on the existing content of a layer.
      // Photoshop allows filling the empty space if it's within the canvas.
      // For now, let's limit it to the layer bounds for simplicity.
      return;
    }

    this.historySnapshot = createHistoryState(context.project);
    this.performFill(clickX, clickY, context, layer);
  }

  private async performFill(clickX: number, clickY: number, context: ToolContext, layer: any) {
    const canvas = await context.ensureLayerCanvas(layer);
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const localX = clickX - layer.x;
    const localY = clickY - layer.y;

    const targetIdx = (localY * canvas.width + localX) * 4;
    const targetR = data[targetIdx];
    const targetG = data[targetIdx + 1];
    const targetB = data[targetIdx + 2];
    const targetA = data[targetIdx + 3];

    const settings = context.settings.paintBucket || { tolerance: 40, antiAliasing: true, contiguous: true };
    const fillColor = this.hexToRgba(context.foregroundColor);

    // If target is same as fill color, do nothing (to avoid infinite loops or redundant work)
    if (
      this.colorsMatch(targetR, targetG, targetB, targetA, fillColor.r, fillColor.g, fillColor.b, fillColor.a, 0)
    ) {
      return;
    }

    if (settings.contiguous) {
      this.floodFill(data, canvas.width, canvas.height, localX, localY, targetR, targetG, targetB, targetA, fillColor, settings.tolerance);
    } else {
      this.globalReplace(data, targetR, targetG, targetB, targetA, fillColor, settings.tolerance);
    }

    ctx.putImageData(imageData, 0, 0);

    // Update layer
    const dataUrl = canvas.toDataURL("image/png");
    context.setLayerCache(layer.id, canvas);

    const layers = context.project.layers.map((l) => {
      if (l.id === layer.id) {
        return { ...l, data: dataUrl };
      }
      return l;
    });

    if (this.historySnapshot) {
      context.addHistoryEntry({
        description: "Paint Bucket",
        state: this.historySnapshot,
      });
    }
    context.updateProject({ layers, isDirty: true });
  }

  private floodFill(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    startX: number,
    startY: number,
    tr: number,
    tg: number,
    tb: number,
    ta: number,
    fill: { r: number; g: number; b: number; a: number },
    tolerance: number
  ) {
    const stack: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(width * height);

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const idx = (y * width + x);
      if (visited[idx]) continue;
      visited[idx] = 1;

      const pixelIdx = idx * 4;
      if (this.colorsMatch(data[pixelIdx], data[pixelIdx + 1], data[pixelIdx + 2], data[pixelIdx + 3], tr, tg, tb, ta, tolerance)) {
        data[pixelIdx] = fill.r;
        data[pixelIdx + 1] = fill.g;
        data[pixelIdx + 2] = fill.b;
        data[pixelIdx + 3] = fill.a;

        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
      }
    }
  }

  private globalReplace(
    data: Uint8ClampedArray,
    tr: number,
    tg: number,
    tb: number,
    ta: number,
    fill: { r: number; g: number; b: number; a: number },
    tolerance: number
  ) {
    for (let i = 0; i < data.length; i += 4) {
      if (this.colorsMatch(data[i], data[i + 1], data[i + 2], data[i + 3], tr, tg, tb, ta, tolerance)) {
        data[i] = fill.r;
        data[i + 1] = fill.g;
        data[i + 2] = fill.b;
        data[i + 3] = fill.a;
      }
    }
  }

  private colorsMatch(r1: number, g1: number, b1: number, a1: number, r2: number, g2: number, b2: number, a2: number, tolerance: number): boolean {
    if (tolerance === 0) {
      return r1 === r2 && g1 === g2 && b1 === b2 && a1 === a2;
    }
    // Tolerance is 0-255. Max distance is sqrt(255^2 * 4) = 510.
    // We can normalize tolerance or just compare directly.
    // Photoshop's tolerance 32 means a distance of 32 in each channel? No, it's usually sum of differences or euclidean.
    // Let's use a simpler per-channel check for now to match common expectations.
    return (
      Math.abs(r1 - r2) <= tolerance &&
      Math.abs(g1 - g2) <= tolerance &&
      Math.abs(b1 - b2) <= tolerance &&
      Math.abs(a1 - a2) <= tolerance
    );
  }

  private hexToRgba(hex: string): { r: number; g: number; b: number; a: number } {
    let r = 0, g = 0, b = 0;
    const a = 255;
    if (hex.startsWith("#")) {
      if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
      } else if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      }
    }
    return { r, g, b, a };
  }

  onDeactivate(context: ToolContext): void {
    context.canvas.style.cursor = "default";
  }
}
