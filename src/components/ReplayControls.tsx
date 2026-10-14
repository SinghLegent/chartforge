"use client";

import { Play, Pause, SkipForward, X } from "lucide-react";
import clsx from "clsx";

type Props = {
  active: boolean;
  playing: boolean;
  speed: number;
  progress: number;
  onStart: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onSpeedChange: (s: number) => void;
  onExit: () => void;
};

const SPEEDS = [1, 2, 5, 10];

export default function ReplayControls({
  active, playing, speed, progress,
  onStart, onPlay, onPause, onStep, onSpeedChange, onExit,
}: Props) {
  if (!active) {
    return (
      <button
        onClick={onStart}
        className="flex items-center gap-1.5 px-2.5 h-7 rounded text-xs text-muted hover:text-text hover:bg-surface-elevated transition-colors"
        title="Bar Replay"
      >
        <Play size={14} />
        <span>Replay</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated border border-border shadow-toolbar">
      <button
        onClick={playing ? onPause : onPlay}
        className="w-8 h-8 flex items-center justify-center rounded-md bg-accent text-on-accent hover:bg-accent-muted transition-colors"
        title={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <button
        onClick={onStep}
        className="w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-text hover:bg-surface transition-colors"
        title="Step forward"
      >
        <SkipForward size={16} />
      </button>
      <div className="flex items-center gap-1 ml-1">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={clsx(
              "px-2 h-7 rounded text-xs font-medium transition-colors",
              speed === s ? "bg-accent/20 text-accent" : "text-muted hover:text-text"
            )}
          >
            {s}x
          </button>
        ))}
      </div>
      <div className="w-32 h-1.5 mx-2 rounded-full bg-surface overflow-hidden">
        <div className="h-full bg-accent transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>
      <button
        onClick={onExit}
        className="w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-danger hover:bg-surface transition-colors"
        title="Exit replay"
      >
        <X size={16} />
      </button>
    </div>
  );
}
