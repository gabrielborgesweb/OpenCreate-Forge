/**
 * Purpose: Individual layer entry component within the layer list, handling visibility, locking, renaming, and selection from thumbnails.
 */
import React, { useState, useRef, useEffect } from "react";
import { useProjectStore, Layer } from "@store/projectStore";
import { useUIStore } from "@store/uiStore";
import { getOptimizedBoundingBox } from "@/core/utils/imageUtils";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  // Trash2,
  // Copy
} from "lucide-react";

interface LayerItemProps {
  layer: Layer;
  projectId: string;
  isActive: boolean;
  isSelected: boolean;
  index: number;
  draggedIndex: number | null;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number, position: "above" | "below") => void;
  onDrop: (e: React.DragEvent, index: number, position: "above" | "below") => void;
  onClick: (e: React.MouseEvent, layerId: string) => void;
  onVisibilityMouseDown: (e: React.MouseEvent, layerId: string) => void;
  onVisibilityMouseEnter: (e: React.MouseEvent, layerId: string) => void;
}

const LayerItem: React.FC<LayerItemProps> = ({
  layer,
  projectId,
  isActive,
  isSelected,
  index,
  draggedIndex,
  onDragStart,
  onDragOver,
  onDrop,
  onClick,
  onVisibilityMouseDown,
  onVisibilityMouseEnter,
}) => {
  const renameLayer = useProjectStore((state) => state.renameLayer);
  const toggleLayerLock = useProjectStore((state) => state.toggleLayerLock);
  // const setActiveLayer = useProjectStore((state) => state.setActiveLayer);
  const updateProject = useProjectStore((state) => state.updateProject);
  const showToast = useUIStore((state) => state.showToast);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);
  const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    // Prevent feedback on the item being dragged
    if (draggedIndex === index) {
      return;
    }

    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const position = e.clientY <= midpoint ? "above" : "below";
      setDropPosition(position);
      onDragOver(e, index, position);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropPosition) {
      onDrop(e, index, dropPosition);
    }
    setDropPosition(null);
  };

  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLayerLock(projectId, layer.id);
  };

  const handleThumbnailClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      if (!layer.data) {
        showToast("Layer is empty", "warning");
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = layer.width;
        canvas.height = layer.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);

        const bounds = getOptimizedBoundingBox(canvas, {
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
        });

        if (!bounds) {
          showToast("Layer is empty", "warning");
          return;
        }

        // Create mask (white on black)
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = bounds.width;
        maskCanvas.height = bounds.height;
        const mctx = maskCanvas.getContext("2d")!;

        mctx.drawImage(
          canvas,
          bounds.x,
          bounds.y,
          bounds.width,
          bounds.height,
          0,
          0,
          bounds.width,
          bounds.height,
        );
        mctx.globalCompositeOperation = "source-in";
        mctx.fillStyle = "white";
        mctx.fillRect(0, 0, bounds.width, bounds.height);

        useProjectStore.getState().pushHistory(projectId, "Select");

        updateProject(projectId, {
          selection: {
            hasSelection: true,
            bounds: {
              x: layer.x + bounds.x,
              y: layer.y + bounds.y,
              width: bounds.width,
              height: bounds.height,
            },
            mask: maskCanvas.toDataURL(),
          },
        });
      };
      img.src = layer.data;
    }
  };

  const handleRename = () => {
    if (editName.trim() && editName !== layer.name) {
      renameLayer(projectId, layer.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRename();
    if (e.key === "Escape") {
      setEditName(layer.name);
      setIsEditing(false);
    }
  };

  // const handleDelete = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   removeLayer(projectId, layer.id);
  // };

  // const handleDuplicate = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   duplicateLayer(projectId, layer.id);
  // };

  return (
    <div
      ref={itemRef}
      className={`group flex items-center p-1 px-2 select-none border-b border-bg-tertiary ${
        isActive
          ? "bg-bg-tertiary shadow-[inset_1px_0_0_0_var(--color-accent)]"
          : isSelected
            ? "bg-bg-tertiary/70"
            : "bg-transparent hover:bg-bg-tertiary/30"
      } ${!layer.visible ? "opacity-60" : ""} ${draggedIndex === index ? "opacity-30" : ""} ${
        dropPosition === "above" ? "border-t-2 border-t-accent" : ""
      } ${dropPosition === "below" ? "border-b-2 border-b-accent" : ""}`}
      onClick={(e) => onClick(e, layer.id)}
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={handleDragOver}
      onDragLeave={() => setDropPosition(null)}
      onDrop={handleDrop}
    >
      <button
        onMouseDown={(e) => onVisibilityMouseDown(e, layer.id)}
        onMouseEnter={(e) => onVisibilityMouseEnter(e, layer.id)}
        tabIndex={-1}
        className={`bg-none border-none flex transition-colors mr-2 relative after:absolute after:inset-[-4px] after:cursor-pointer ${
          layer.visible ? "text-text" : "text-[#666]"
        }`}
      >
        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>

      {/* Thumbnail */}
      <div
        className={`w-8 h-8 bg-[#333] rounded border flex items-center justify-center overflow-hidden mr-2 shrink-0 transition-colors ${isActive ? "border-accent" : "border-white/10"}`}
        onClick={handleThumbnailClick}
      >
        {layer.data ? (
          <img
            src={layer.data}
            alt=""
            className="max-w-full max-h-full object-contain pointer-events-none"
          />
        ) : (
          <div className="text-[0.6rem] text-[#555] pointer-events-none">
            {layer.type[0].toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            className="w-full bg-transparent text-text text-[0.85rem] px-1 rounded outline-none -m-1 selection:bg-accent"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="text-[0.85rem] truncate"
            onDoubleClick={() => {
              setEditName(layer.name);
              setIsEditing(true);
            }}
          >
            {layer.name}
          </div>
        )}
      </div>

      <div
        className={`flex items-center gap-1 ${!layer.locked ? "opacity-0" : ""} group-hover:opacity-100 transition-opacity ml-1`}
      >
        {/* <button
          onClick={handleDuplicate}
          title="Duplicate Layer"
          className="p-1 hover:text-accent text-[#666] transition-colors"
        >
          <Copy size={12} />
        </button> */}
        {/* <button
          onClick={handleDelete}
          title="Delete Layer"
          className="p-1 hover:text-red-400 text-[#666] transition-colors"
        >
          <Trash2 size={12} />
        </button> */}
        <button
          onClick={toggleLock}
          tabIndex={-1}
          className={`p-1 !cursor-pointer transition-colors ${
            layer.locked ? "text-[#ffcc00]" : "text-[#666] hover:text-text"
          }`}
        >
          {layer.locked ? <Lock size={16} /> : <Unlock size={16} />}
        </button>
      </div>
    </div>
  );
};

export default LayerItem;
