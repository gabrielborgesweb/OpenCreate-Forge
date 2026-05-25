/**
 * Purpose: Global state for UI components, managing active tabs, project history, toast notifications, and sidebar configuration.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UIState {
  activeTab: "home" | string; // 'home' or project ID
  tabHistory: string[]; // Stack of IDs (the last one is current)
  toast: {
    message: string;
    type: "info" | "warning" | "error";
    visible: boolean;
    duration: number;
  } | null;
  activeSidebarTab: "layers" | "history";
  sidebarWidth: number;
  isSidebarExpanded: boolean;
  showRulers: boolean;
  lastExportFormat: string;
  lastExportQuality: number;
  lastLockAspectRatio: boolean;
  setActiveTab: (tab: "home" | string) => void;
  removeFromHistory: (tabId: string) => void;
  showToast: (message: string, type?: "info" | "warning" | "error", duration?: number) => void;
  hideToast: () => void;
  setActiveSidebarTab: (tab: "layers" | "history") => void;
  setSidebarWidth: (width: number) => void;
  setIsSidebarExpanded: (expanded: boolean) => void;
  setShowRulers: (show: boolean) => void;
  setExportSettings: (format: string, quality: number, lockAspectRatio: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      activeTab: "home",
      tabHistory: ["home"],
      toast: null,
      activeSidebarTab: "layers",
      sidebarWidth: 280,
      isSidebarExpanded: true,
      showRulers: true,
      lastExportFormat: "image/png",
      lastExportQuality: 100,
      lastLockAspectRatio: true,
      setActiveTab: (tab) =>
        set((state) => {
          const newHistory = state.tabHistory.filter((id) => id !== tab);
          newHistory.push(tab);
          return { activeTab: tab, tabHistory: newHistory };
        }),
      removeFromHistory: (tabId) =>
        set((state) => ({
          tabHistory: state.tabHistory.filter((id) => id !== tabId),
        })),
      showToast: (message, type = "info", duration = 3000) => {
        set({ toast: { message, type, visible: true, duration } });
      },
      hideToast: () => {
        const currentToast = get().toast;
        if (currentToast) {
          set({ toast: { ...currentToast, visible: false } });
          setTimeout(() => {
            set({ toast: null });
          }, 300); // Wait for fade-out animation
        }
      },
      setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
      setSidebarWidth: (width) => set({ sidebarWidth: Math.max(200, Math.min(width, 600)) }),
      setIsSidebarExpanded: (expanded) => set({ isSidebarExpanded: expanded }),
      setShowRulers: (show) => set({ showRulers: show }),
      setExportSettings: (format, quality, lockAspectRatio) =>
        set({
          lastExportFormat: format,
          lastExportQuality: quality,
          lastLockAspectRatio: lockAspectRatio,
        }),
    }),
    {
      name: "forge-ui-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeSidebarTab: state.activeSidebarTab,
        sidebarWidth: state.sidebarWidth,
        isSidebarExpanded: state.isSidebarExpanded,
        showRulers: state.showRulers,
        lastExportFormat: state.lastExportFormat,
        lastExportQuality: state.lastExportQuality,
        lastLockAspectRatio: state.lastLockAspectRatio,
      }),
    },
  ),
);
