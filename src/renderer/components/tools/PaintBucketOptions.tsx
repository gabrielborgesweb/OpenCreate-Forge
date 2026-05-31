/**
 * Purpose: Tool options component for the Paint Bucket tool, featuring tolerance, anti-aliasing, and contiguous controls.
 */
import React from "react";
import { useToolStore } from "@/renderer/store/toolStore";
import ToolSettingInput from "@/renderer/components/ui/ToolSettingInput";

export const PaintBucketOptions: React.FC = () => {
  const toolSettings = useToolStore((state) => state.toolSettings);
  const updateToolSettings = useToolStore((state) => state.updateToolSettings);

  const settings = toolSettings.paintBucket || {
    tolerance: 40,
    antiAliasing: true,
    contiguous: true,
  };
  const { tolerance, antiAliasing, contiguous } = settings;

  return (
    <div className="flex items-center gap-4 h-full text-[0.75rem]">
      <ToolSettingInput
        label="Tolerance"
        min={0}
        max={255}
        value={tolerance}
        onChange={(val) => updateToolSettings("paintBucket", { tolerance: val })}
      />

      <div
        className="flex items-center gap-2 cursor-pointer select-none"
        onClick={() => updateToolSettings("paintBucket", { antiAliasing: !antiAliasing })}
      >
        <input
          type="checkbox"
          checked={antiAliasing}
          readOnly
          className="w-3 h-3 rounded bg-[#333] border-white/10 accent-accent transition-all cursor-pointer"
        />
        <span className="font-bold text-[#999]">ANTI-ALIAS</span>
      </div>

      <div
        className="flex items-center gap-2 cursor-pointer select-none"
        onClick={() => updateToolSettings("paintBucket", { contiguous: !contiguous })}
      >
        <input
          type="checkbox"
          checked={contiguous}
          readOnly
          className="w-3 h-3 rounded bg-[#333] border-white/10 accent-accent transition-all cursor-pointer"
        />
        <span className="font-bold text-[#999]">CONTIGUOUS</span>
      </div>
    </div>
  );
};
