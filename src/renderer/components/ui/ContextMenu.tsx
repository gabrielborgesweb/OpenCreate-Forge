import React, { useEffect, useRef, useState, useCallback } from "react";

export type ContextMenuItem =
  | {
      label: string;
      icon?: React.ElementType;
      onClick: () => void;
      danger?: boolean;
    }
  | {
      isSeparator: true;
    };

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 100); // Matches animation-context-menu-out duration
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose]);

  // Adjust position if menu goes off screen
  // const menuWidth = 200;
  // const menuHeight = items.length * 36 + 16; // Approximate height

  const posX = x;
  const posY = y;

  // if (x + menuWidth > window.innerWidth) {
  //   posX = x - menuWidth;
  // }
  // if (y + menuHeight > window.innerHeight) {
  //   posY = y - menuHeight;
  // }

  return (
    <>
      <style>
        {`
      @keyframes context-menu-in {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes context-menu-out {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }

      .animate-context-menu-in {
        transform-origin: top left;
        animation: context-menu-in 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      .animate-context-menu-out {
        transform-origin: top left;
        animation: context-menu-out 100ms ease-in forwards;
      }
      `}
      </style>
      <div
        ref={menuRef}
        className={`fixed z-[1000] bg-bg-primary/80 backdrop-blur-lg border border-bg-tertiary rounded-lg shadow-xl py-2 min-w-[200px] ${
          isExiting ? "animate-context-menu-out" : "animate-context-menu-in"
        }`}
        style={{ top: posY, left: posX }}
      >
        {items.map((item, index) => {
          if ("isSeparator" in item) {
            return <div key={index} className="my-1 border-b border-bg-tertiary" />;
          }

          return (
            <div
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                handleClose();
              }}
              className={`flex items-center gap-3 px-3 py-1 cursor-pointer transition-colors ${
                item.danger ? "text-red-400 hover:bg-red-400/10" : "text-text hover:bg-white/10"
              }`}
            >
              {item.icon && <item.icon size={16} />}
              <span className="text-[0.85rem]">{item.label}</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ContextMenu;
