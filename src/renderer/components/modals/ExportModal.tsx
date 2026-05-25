/**
 * Purpose: Advanced export modal with interactive preview (zoom/pan), estimated file size, and format/quality settings.
 * Design follows the NewProjectModal pattern (900x600px, two-column layout).
 */
import React, { useState, useEffect, useRef } from "react";
import { useProjectStore } from "@store/projectStore";
import { Info, ZoomIn, ZoomOut, Maximize, FileImage, ImageDown } from "lucide-react";
import BaseModal from "./BaseModal";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formats = [
  { label: "PNG", value: "image/png", ext: "png" },
  { label: "JPEG", value: "image/jpeg", ext: "jpg" },
  { label: "WEBP", value: "image/webp", ext: "webp" },
];

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const projects = useProjectStore((state) => state.projects);
  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Form State
  const [filename, setFilename] = useState("");
  const [format, setFormat] = useState(formats[0]);
  const [quality, setQuality] = useState(100);

  // Preview State
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const filenameInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && activeProject) {
      setFilename(activeProject.name);
      setFormat(formats[0]);
      setQuality(100);
      setPan({ x: 0, y: 0 });
      setTimeout(() => {
        filenameInputRef.current?.focus();
        filenameInputRef.current?.select();
      }, 50);
    }
  }, [isOpen, activeProject]);

  // Generate preview and calculate size
  useEffect(() => {
    if (!isOpen || !activeProject) return;

    const generatePreview = async () => {
      window.dispatchEvent(
        new CustomEvent("forge:request-export-preview", {
          detail: {
            format: format.value,
            quality: quality / 100,
            callback: (dataUrl: string) => {
              setPreviewUrl(dataUrl);
              // Calculate size
              const base64Length = dataUrl.split(",")[1].length;
              const sizeInBytes = base64Length * 0.75;
              setFileSize(sizeInBytes);
            },
          },
        }),
      );
    };

    const timer = setTimeout(generatePreview, 300); // Debounce
    return () => clearTimeout(timer);
  }, [isOpen, activeProject, format, quality]);

  // Viewport Logic (Matches engine feeling)
  const resetPreview = () => {
    if (!activeProject || !previewContainerRef.current) return;

    const container = previewContainerRef.current;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    const padding = 40;
    const scaleX = (cw - padding * 2) / activeProject.width;
    const scaleY = (ch - padding * 2) / activeProject.height;
    const scale = Math.min(scaleX, scaleY);

    setZoom(scale);
    setPan({ x: 0, y: 0 });
  };

  // Auto-fit on first load
  useEffect(() => {
    if (isOpen && activeProject && previewUrl) {
      resetPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, !!previewUrl]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (!previewContainerRef.current) return;

    const delta = e.deltaY > 0 ? 0.8 : 1.2;
    const nextZoom = Math.max(0.01, Math.min(zoom * delta, 50));

    // Zoom towards mouse position
    const rect = previewContainerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mx = e.clientX - rect.left - centerX;
    const my = e.clientY - rect.top - centerY;

    const newPanX = mx - (mx - pan.x) * (nextZoom / zoom);
    const newPanY = my - (my - pan.y) * (nextZoom / zoom);

    setZoom(nextZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const formatSize = (bytes: number | null) => {
    if (bytes === null) return "Calculating...";
    if (bytes < 1024) return `${bytes.toFixed(0)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleExport = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeProject) return;

    const filters = [{ name: format.label, extensions: [format.ext] }];

    window.dispatchEvent(
      new CustomEvent("forge:export-project", {
        detail: {
          format: format.value,
          quality: quality / 100,
          filename: `${filename}.${format.ext}`,
          filters,
        },
      }),
    );
    onClose();
  };

  const formatInfo = {
    "image/png": "PNG is a lossless format, ideal for graphics with transparency or sharp edges.",
    "image/jpeg": "JPEG is a lossy format best for photographs. It does not support transparency.",
    "image/webp": "WebP provides superior compression and quality for web use.",
  };

  if (!activeProject) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Export for Web"
      icon={ImageDown}
      width="900px"
      height="600px"
    >
      <form onSubmit={handleExport} className="flex flex-1 overflow-hidden">
        {/* Left Panel: Interactive Preview */}
        <div className="w-[600px] border-r border-bg-tertiary flex flex-col bg-[#1e1e1e] relative group">
          <div
            ref={previewContainerRef}
            className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* Checkerboard Background */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)`,
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                backgroundColor: "#111",
              }}
            />

            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                draggable={false}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  maxWidth: "none",
                  boxShadow: "0 0 40px rgba(0,0,0,0.5)",
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                  imageRendering: "pixelated",
                }}
              />
            ) : (
              <div className="text-[#444] flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                <span className="text-xs font-bold uppercase tracking-widest">
                  Generating Preview...
                </span>
              </div>
            )}

            {/* Preview Controls overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-[#252525]/80 backdrop-blur-md p-1.5 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => {
                  const nextZoom = Math.min(zoom * 1.2, 50);
                  setZoom(nextZoom);
                }}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-text"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextZoom = Math.max(zoom * 0.8, 0.01);
                  setZoom(nextZoom);
                }}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-text"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                type="button"
                onClick={resetPreview}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-text"
                title="Fit Preview"
              >
                <Maximize size={16} />
              </button>
            </div>
          </div>

          {/* Size Info Footer */}
          <div className="p-3 bg-bg-secondary border-t border-bg-tertiary flex justify-between items-center px-4">
            <div className="flex items-center gap-2 text-[#999]">
              <FileImage size={14} />
              <span className="text-[0.65rem] font-bold uppercase tracking-wider">
                {activeProject.width} × {activeProject.height} PX
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[0.65rem] text-[#666] uppercase tracking-wider">
                Estimated Size
              </span>
              <span className="text-xs font-mono font-bold text-accent">
                {formatSize(fileSize)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Settings */}
        <div className="flex-1 p-4 flex flex-col justify-between bg-[#252525]" id="export-details">
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="text-[0.75rem] text-[#999]">Filename</label>
                  <input
                    ref={filenameInputRef}
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="bg-bg-primary border border-border text-text p-2 rounded text-sm selection:bg-accent outline-none transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
                    placeholder="Filename"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.75rem] text-[#999]">Format</label>
                  <select
                    value={format.value}
                    onChange={(e) => {
                      const selected = formats.find((f) => f.value === e.target.value);
                      if (selected) setFormat(selected);
                    }}
                    className="w-full bg-bg-primary border border-border text-text p-2 rounded text-sm outline-none cursor-pointer hover:bg-[#333] transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
                  >
                    {formats.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quality Settings */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="text-[0.75rem] text-[#999] font-medium">Quality</label>
                  <span className="text-xs font-mono text-accent font-bold">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-[0.6rem] text-[#777] font-bold uppercase tracking-tighter">
                  <span>Small Size</span>
                  <span>Best Quality</span>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-[#ccc] shrink-0 mt-0.5" />
                <p className="text-[0.7rem] text-[#ccc] leading-normal font-medium text-pretty">
                  {formatInfo[format.value as keyof typeof formatInfo]}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              className="p-3 bg-accent text-white border-none rounded font-bold hover:brightness-110 transition-all text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
            >
              Export Image
            </button>
            {/* <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#666] hover:text-[#999] transition-colors text-xs font-bold uppercase tracking-widest outline-none focus-visible:text-text"
            >
              Cancel
            </button> */}
          </div>
        </div>
      </form>
    </BaseModal>
  );
};

export default ExportModal;
