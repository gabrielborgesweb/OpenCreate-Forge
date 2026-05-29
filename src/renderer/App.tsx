/**
 * Purpose: Root React component that defines the application layout, manages global keyboard shortcuts, and orchestrates the main UI components.
 */
import React from "react";
import { useUIStore } from "@store/uiStore";
import { useProjectStore, Project } from "@store/projectStore";
import CanvasViewport from "./components/CanvasViewport";
import RightSidebar from "./components/Sidebar/RightSidebar";
import Toolbar from "./components/Toolbar";
import ToolOptions from "./components/ToolOptions";
import ProjectTabs from "./components/ProjectTabs";
import HomeScreen from "./components/HomeScreen";
import NewProject from "./components/modals/NewProject";
import ExportModal from "./components/modals/ExportModal";
import { PreferencesModal } from "./components/modals/PreferencesModal";
import { usePreferencesStore } from "./store/preferencesStore";
import { useAutosave } from "./hooks/useAutosave";
import { useToolStore } from "@store/toolStore";
import Toast from "./components/ui/Toast";
import { useMenuHandler } from "./hooks/useMenuHandler";

import { getClipboardImageDimensions } from "@utils/clipboardUtils";
// ... (imports remain)

function App() {
  useMenuHandler();
  useAutosave();
  const theme = usePreferencesStore((state) => state.theme);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const activeTab = useUIStore((state) => state.activeTab);
  const initializeStore = useProjectStore((state) => state.initialize);
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);

  React.useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = React.useState(false);
  const [newProjectInitialDimensions, setNewProjectInitialDimensions] = React.useState<
    { width: number; height: number } | undefined
  >(undefined);
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (!(window as any).electronAPI) return;
    const hasProject = projects.length > 0 && activeProjectId !== null && activeTab !== "home";
    (window as any).electronAPI.updateMenu({ hasProject });
  }, [projects.length, activeProjectId, activeTab]);
  const setActiveTool = useToolStore((state) => state.setActiveTool);
  const activeToolId = useToolStore((state) => state.activeToolId);
  const toolSettings = useToolStore((state) => state.toolSettings);
  const updateToolSettings = useToolStore((state) => state.updateToolSettings);
  const transformSettings = useToolStore((state) => state.toolSettings.transform);
  const showToast = useUIStore((state) => state.showToast);
  const isInteracting = useToolStore((state) => state.isInteracting);
  const setShowRulers = useUIStore((state) => state.setShowRulers);
  const showRulers = useUIStore((state) => state.showRulers);
  const swapColors = useToolStore((state) => state.swapColors);
  const resetColors = useToolStore((state) => state.resetColors);

  const originalModeRef = React.useRef<any>(null);
  const pendingRestoreRef = React.useRef<boolean>(false);

  const activeProject = useProjectStore((state) =>
    state.projects.find((p) => p.id === activeProjectId),
  );

  // Restore mode when interaction ends
  React.useEffect(() => {
    if (!isInteracting && pendingRestoreRef.current && originalModeRef.current) {
      updateToolSettings("select", { mode: originalModeRef.current });
      originalModeRef.current = null;
      pendingRestoreRef.current = false;
    }
  }, [isInteracting, updateToolSettings]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (useUIStore.getState().isAnyModalOpen()) return;
      if (e.key === "Alt") e.preventDefault(); // Prevent app menu focus

      // Handle SelectTool modifiers for visual feedback
      if (activeToolId === "select") {
        if ((e.shiftKey || e.altKey) && !originalModeRef.current) {
          originalModeRef.current = toolSettings.select.mode;
        }

        if (!isInteracting) {
          if (e.shiftKey && e.altKey) {
            updateToolSettings("select", { mode: "intersect" });
          } else if (e.shiftKey) {
            updateToolSettings("select", { mode: "unite" });
          } else if (e.altKey) {
            updateToolSettings("select", { mode: "subtract" });
          }
        }
      }

      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      // Ignore if typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        // Exception: allow shortcuts if it's the hidden text input and we're not actively editing
        if (document.activeElement.id === "forge-text-input" && !toolSettings.text.isEditing) {
          // Continue to global shortcuts
        } else {
          if (e.key === "Enter") {
            if (activeToolId === "transform")
              window.dispatchEvent(new CustomEvent("forge:transform-apply"));
            if (activeToolId === "crop") window.dispatchEvent(new CustomEvent("forge:crop-apply"));
          } else if (e.key === "Escape") {
            if (activeToolId === "transform")
              window.dispatchEvent(new CustomEvent("forge:transform-cancel"));
            if (activeToolId === "crop") window.dispatchEvent(new CustomEvent("forge:crop-cancel"));
          }
          return;
        }
      }

      const checkDirty = (nextToolId: string) => {
        if (
          activeToolId === "transform" &&
          transformSettings.isDirty &&
          nextToolId !== "transform"
        ) {
          return false;
        }
        return true;
      };

      if (isCmdOrCtrl && e.key.toLowerCase() === "t") {
        e.preventDefault();
        if (checkDirty("transform")) setActiveTool("transform");
      } else if (e.key === "Enter") {
        if (activeToolId === "transform")
          window.dispatchEvent(new CustomEvent("forge:transform-apply"));
        if (activeToolId === "crop") window.dispatchEvent(new CustomEvent("forge:crop-apply"));
      } else if (e.key === "Escape") {
        if (activeToolId === "transform")
          window.dispatchEvent(new CustomEvent("forge:transform-cancel"));
        if (activeToolId === "crop") window.dispatchEvent(new CustomEvent("forge:crop-cancel"));
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        // Tool shortcuts - only if no modifiers
        if (e.key.toLowerCase() === "v") {
          if (checkDirty("move")) setActiveTool("move");
        } else if (e.key.toLowerCase() === "b") {
          if (checkDirty("brush")) setActiveTool("brush");
        } else if (e.key.toLowerCase() === "e") {
          if (checkDirty("eraser")) setActiveTool("eraser");
        } else if (e.key.toLowerCase() === "p") {
          if (checkDirty("pencil")) setActiveTool("pencil");
        } else if (e.key.toLowerCase() === "m") {
          if (checkDirty("select")) setActiveTool("select");
        } else if (e.key.toLowerCase() === "c") {
          if (checkDirty("crop")) setActiveTool("crop");
        } else if (e.key.toLowerCase() === "t") {
          if (checkDirty("text")) setActiveTool("text");
        } else if (e.key.toLowerCase() === "g") {
          if (checkDirty("paintBucket")) setActiveTool("paintBucket");
        } else if (e.key.toLowerCase() === "x") {
          swapColors();
        } else if (e.key.toLowerCase() === "d") {
          resetColors();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (useUIStore.getState().isAnyModalOpen()) return;
      if (activeToolId === "select" && originalModeRef.current) {
        if (!e.shiftKey && !e.altKey) {
          if (isInteracting) {
            pendingRestoreRef.current = true;
          } else {
            updateToolSettings("select", { mode: originalModeRef.current });
            originalModeRef.current = null;
            pendingRestoreRef.current = false;
          }
        } else if (!isInteracting) {
          if (e.shiftKey && !e.altKey) {
            updateToolSettings("select", { mode: "unite" });
          } else if (!e.shiftKey && e.altKey) {
            updateToolSettings("select", { mode: "subtract" });
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    setActiveTool,
    activeToolId,
    transformSettings.isDirty,
    showToast,
    toolSettings.select.mode,
    toolSettings.text.isEditing,
    updateToolSettings,
    showRulers,
    setShowRulers,
    activeProjectId,
    isInteracting,
    swapColors,
    resetColors,
  ]);

  const [exportProject, setExportProject] = React.useState<Project | null>(null);

  React.useEffect(() => {
    const handleNewProject = async () => {
      const dimensions = await getClipboardImageDimensions();
      setNewProjectInitialDimensions(dimensions || undefined);
      setIsNewProjectModalOpen(true);
    };
    const handleOpenExportModal = (e: any) => {
      setExportProject(e.detail?.project || null);
      setIsExportModalOpen(true);
    };
    const handleOpenPreferences = () => setIsPreferencesModalOpen(true);

    window.addEventListener("forge:new-project", handleNewProject);
    window.addEventListener("forge:open-export-modal", handleOpenExportModal as any);
    window.addEventListener("forge:open-preferences", handleOpenPreferences);

    return () => {
      window.removeEventListener("forge:new-project", handleNewProject);
      window.removeEventListener("forge:open-export-modal", handleOpenExportModal as any);
      window.removeEventListener("forge:open-preferences", handleOpenPreferences);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-bg-primary text-text overflow-hidden relative">
      <Toast />
      <NewProject
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        initialDimensions={newProjectInitialDimensions}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportProject(null);
        }}
        project={exportProject || undefined}
      />{" "}
      <PreferencesModal
        key={isPreferencesModalOpen ? "open" : "closed"}
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
      />
      {/* 1. Project Tabs */}
      <ProjectTabs />
      {/* 2. Dynamic Header (Tool Options) */}
      {activeTab !== "home" && (
        <header className="bg-[#222] border-b border-bg-tertiary flex items-center">
          <ToolOptions />
        </header>
      )}
      {/* 3. Main Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === "home" ? (
          <HomeScreen />
        ) : (
          <>
            <aside className="bg-[#222] border-r border-bg-tertiary">
              <Toolbar />
            </aside>

            <CanvasViewport key={activeProjectId || "empty"} />

            <RightSidebar />
          </>
        )}
      </main>
      {/* 4. Footer / Status Bar */}
      <footer className="h-[25px] px-4 bg-[#222] border-t border-bg-tertiary text-[0.75rem] flex items-center justify-between text-[#888]">
        <div>
          {activeTab === "home"
            ? "Welcome to OpenCreate Forge"
            : `Editing ${activeProject?.name || "Unknown"}.ocfd`}
        </div>
        {activeProject && (
          <div className="flex gap-4">
            <span>
              {activeProject.width} x {activeProject.height} px
            </span>
            <span className="text-accent font-bold">
              Zoom: {Math.round(activeProject.zoom * 100)}%
            </span>
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;
