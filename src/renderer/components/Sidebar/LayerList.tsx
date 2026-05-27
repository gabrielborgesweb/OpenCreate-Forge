/**
 * Purpose: Sidebar component that displays the stack of layers for the active project, providing controls for adding, deleting, and reordering layers.
 */
import React from "react";
import { useProjectStore } from "@store/projectStore";
import LayerItem from "./LayerItem";
import { Plus, Trash2, Copy } from "lucide-react";

const LayerList: React.FC = () => {
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const project = useProjectStore(
    (state) => state.projects.find((p) => p.id === activeProjectId) || null,
  );
  const addLayer = useProjectStore((state) => state.addLayer);
  const removeLayer = useProjectStore((state) => state.removeLayer);
  const duplicateLayer = useProjectStore((state) => state.duplicateLayer);
  const reorderLayers = useProjectStore((state) => state.reorderLayers);
  const setSelectedLayers = useProjectStore((state) => state.setSelectedLayers);
  const setActiveLayer = useProjectStore((state) => state.setActiveLayer);
  const updateProject = useProjectStore((state) => state.updateProject);

  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  if (!project) return <div className="p-4 text-[#666]">No active project</div>;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    // If the dragged item is not part of the selection, select only it
    let layersToMove = project.selectedLayerIds;
    const draggedLayerId = project.layers[index].id;

    if (!layersToMove.includes(draggedLayerId)) {
      layersToMove = [draggedLayerId];
      setSelectedLayers(project.id, layersToMove);
    }

    e.dataTransfer.setData("text/plain", JSON.stringify(layersToMove));
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, toIndex?: number, position?: "above" | "below") => {
    e.preventDefault();
    e.stopPropagation();

    // if (position !== "above" && position !== "below") {
    //   // Dropped on the container, move to end
    //   toIndex = project.layers.length - 1;
    //   position = "below";
    // }

    const data = e.dataTransfer.getData("text/plain");
    setDraggedIndex(null);

    if (!data) return;

    let layerIds: string[] = [];
    try {
      layerIds = JSON.parse(data);
    } catch {
      // Fallback for single index (compatibility with old data)
      const fromIndex = parseInt(data, 10);
      if (!isNaN(fromIndex)) {
        layerIds = [project.layers[fromIndex].id];
      }
    }

    if (layerIds.length === 0) return;

    // Only process if dropped on a LayerItem (toIndex is defined)
    // OR if dropped on the LayerList container itself (toIndex is undefined)
    const targetLayerId = toIndex !== undefined ? project.layers[toIndex].id : null;
    const reorderPosition = position === "above" ? "above" : "below"; // Default to "below" if position is undefined

    console.log("Reordering layers: ", {
      projectId: project.id,
      layerIds,
      targetLayerId,
      reorderPosition,
    });

    reorderLayers(project.id, layerIds, targetLayerId, reorderPosition);
  };

  const handleLayerClick = (e: React.MouseEvent, layerId: string) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;

    if (isShift && project.activeLayerId) {
      // Selection range
      const startIndex = project.layers.findIndex((l) => l.id === project.activeLayerId);
      const endIndex = project.layers.findIndex((l) => l.id === layerId);

      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex);

      const rangeIds = project.layers.slice(start, end + 1).map((l) => l.id);
      setSelectedLayers(project.id, rangeIds);
      updateProject(project.id, { activeLayerId: layerId });
    } else if (isCtrl) {
      // Toggle individual
      const isSelected = project.selectedLayerIds.includes(layerId);

      if (isSelected && project.activeLayerId !== layerId) {
        // If already selected but not active, just make it active without changing selection
        updateProject(project.id, { activeLayerId: layerId });
      } else if (isSelected) {
        // If already active and selected, deselect it
        const newSelection = project.selectedLayerIds.filter((id) => id !== layerId);
        setSelectedLayers(project.id, newSelection);
      } else {
        // Add to selection and make active
        const newSelection = [...project.selectedLayerIds, layerId];
        setSelectedLayers(project.id, newSelection);
        updateProject(project.id, { activeLayerId: layerId });
      }
    } else {
      // Single selection
      setActiveLayer(project.id, layerId);
    }
  };

  const handleAddNewLayer = () => {
    addLayer(project.id, {
      type: "raster",
      name: `Layer ${project.layers.length + 1}`,
    });
  };

  const handleDeleteActiveLayer = () => {
    if (project.activeLayerId) {
      removeLayer(project.id, project.activeLayerId);
    }
  };

  const handleLayerDropOnContainer = (e: React.DragEvent) => {
    // Only handle if directly on the container (empty space)
    if (e.target === e.currentTarget) {
      handleDrop(e);
    }
  };

  const handleDuplicateActiveLayer = () => {
    if (project.activeLayerId) {
      duplicateLayer(project.id, project.activeLayerId);
    }
  };

  return (
    <div
      className="flex flex-col flex-1 overflow-hidden"
      onDragOver={(e) => handleDragOver(e)}
      onDrop={handleLayerDropOnContainer}
      onDragEnd={() => setDraggedIndex(null)}
    >
      <div
        className="flex-1 overflow-y-auto custom-scrollbar"
        onDragOver={(e) => handleDragOver(e)}
        onDrop={handleLayerDropOnContainer}
        onClick={(e) => {
          // Deselect layers if clicking on empty space
          if (e.target === e.currentTarget) {
            setSelectedLayers(project.id, []);
            setActiveLayer(project.id, null);
          }
        }}
      >
        {project.layers
          .slice()
          .reverse()
          .map((layer, index) => {
            // Note: because we are reversing for display, we need to map the index back
            const actualIndex = project.layers.length - 1 - index;
            return (
              <LayerItem
                key={layer.id}
                layer={layer}
                projectId={project.id}
                isActive={project.activeLayerId === layer.id}
                isSelected={project.selectedLayerIds.includes(layer.id)}
                index={actualIndex}
                draggedIndex={draggedIndex}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleLayerClick}
              />
            );
          })}
      </div>

      {/* Layer Actions Footer */}
      <div className="p-2 border-t border-bg-tertiary flex justify-end gap-2">
        <button
          onClick={handleAddNewLayer}
          className="p-1.5 hover:bg-white/10 rounded transition-colors text-[#ccc] hover:text-white"
          title="New Layer"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={handleDuplicateActiveLayer}
          disabled={!project.activeLayerId}
          className="p-1.5 hover:bg-white/10 rounded transition-colors text-[#ccc] hover:text-white disabled:opacity-30"
          title="Duplicate Layer"
        >
          <Copy size={16} />
        </button>
        <button
          onClick={handleDeleteActiveLayer}
          disabled={!project.activeLayerId || project.layers.length <= 1}
          className="p-1.5 hover:bg-white/10 rounded transition-colors text-[#ccc] hover:text-red-400 disabled:opacity-30"
          title="Delete Layer"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default LayerList;
