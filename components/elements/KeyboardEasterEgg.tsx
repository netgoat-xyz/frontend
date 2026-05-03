"use client";

import { useEffect, useRef, useState } from "react";

const SECRET_SEQUENCE = "20250701";
const BOARD_WIDTH = 32;
const BOARD_HEIGHT = 14;
const BIRD_X = 7;
const GAP_SIZE = 4;
const PIPE_SPACING = 18;
const TICK_MS = 100;
const GRAVITY = 0.52;
const JUMP_VELOCITY = -1.9;

type Pipe = {
  x: number;
  gapStart: number;
  passed: boolean;
};

type GameState = {
  birdY: number;
  velocity: number;
  pipes: Pipe[];
  score: number;
  isGameOver: boolean;
};

type Cell = " " | "pipe" | "bird";

function randomGapStart() {
  return Math.floor(Math.random() * (BOARD_HEIGHT - GAP_SIZE - 4)) + 2;
}

function createInitialGameState(): GameState {
  return {
    birdY: Math.floor(BOARD_HEIGHT / 2),
    velocity: 0,
    pipes: [{ x: BOARD_WIDTH - 1, gapStart: randomGapStart(), passed: false }],
    score: 0,
    isGameOver: false,
  };
}

function renderBoard(game: GameState): Cell[][] {
  const grid: Cell[][] = Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => " ")
  );

  for (const pipe of game.pipes) {
    const x = Math.round(pipe.x);
    if (x < 0 || x >= BOARD_WIDTH) {
      continue;
    }

    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      const inGap = y >= pipe.gapStart && y < pipe.gapStart + GAP_SIZE;
      if (!inGap) {
        grid[y][x] = "pipe";
      }
    }
  }

  const birdY = Math.max(0, Math.min(BOARD_HEIGHT - 1, Math.round(game.birdY)));
  grid[birdY][BIRD_X] = "bird";

  return grid;
}

function advanceGame(previous: GameState): GameState {
  if (previous.isGameOver) {
    return previous;
  }

  const velocity = previous.velocity + GRAVITY;
  const birdY = previous.birdY + velocity;

  let pipes = previous.pipes
    .map((pipe) => ({ ...pipe, x: pipe.x - 1 }))
    .filter((pipe) => pipe.x >= -1);

  const lastPipe = pipes[pipes.length - 1];
  if (!lastPipe || lastPipe.x <= BOARD_WIDTH - PIPE_SPACING) {
    pipes = [...pipes, { x: BOARD_WIDTH - 1, gapStart: randomGapStart(), passed: false }];
  }

  let score = previous.score;
  pipes = pipes.map((pipe) => {
    if (!pipe.passed && pipe.x < BIRD_X) {
      score += 1;
      return { ...pipe, passed: true };
    }
    return pipe;
  });

  const birdRow = Math.round(birdY);
  const hitTopOrBottom = birdRow < 0 || birdRow >= BOARD_HEIGHT;
  const hitPipe = pipes.some((pipe) => {
    const pipeX = Math.round(pipe.x);
    if (pipeX !== BIRD_X) {
      return false;
    }
    return birdRow < pipe.gapStart || birdRow >= pipe.gapStart + GAP_SIZE;
  });

  if (hitTopOrBottom || hitPipe) {
    return {
      ...previous,
      birdY,
      velocity,
      pipes,
      score,
      isGameOver: true,
    };
  }

  return {
    ...previous,
    birdY,
    velocity,
    pipes,
    score,
  };
}

export default function KeyboardEasterEgg() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"prompt" | "game">("prompt");
  const [game, setGame] = useState<GameState>(createInitialGameState());
  const bufferRef = useRef("");

  const closeModal = () => {
    setIsOpen(false);
    setMode("prompt");
  };

  const letsPlayAGame = () => {
    setGame(createInitialGameState());
    setMode("game");
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (/^\d$/.test(event.key)) {
        const nextBuffer = (bufferRef.current + event.key).slice(-SECRET_SEQUENCE.length);
        bufferRef.current = nextBuffer;

        if (nextBuffer === SECRET_SEQUENCE) {
          setIsOpen(true);
          setMode("prompt");
          bufferRef.current = "";
        }
        return;
      }

      if (event.key === "Backspace") {
        bufferRef.current = bufferRef.current.slice(0, -1);
        return;
      }

      bufferRef.current = "";
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || mode !== "game") {
      return;
    }

    const interval = window.setInterval(() => {
      setGame((previous) => advanceGame(previous));
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen || mode !== "game") {
      return;
    }

    const onFlap = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
        event.preventDefault();
        setGame((previous) => {
          if (previous.isGameOver) {
            return previous;
          }
          return {
            ...previous,
            velocity: JUMP_VELOCITY,
          };
        });
      }
    };

    window.addEventListener("keydown", onFlap);
    return () => window.removeEventListener("keydown", onFlap);
  }, [isOpen, mode]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Secret game prompt"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-white/15 bg-neutral-900 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {mode === "prompt" ? (
          <>
            <h2 className="text-xl font-semibold text-white">Secret Prompt</h2>
            <p className="mt-3 text-sm text-white/70">Do you want to play a little game?</p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
              >
                No
              </button>
              <button
                type="button"
                onClick={letsPlayAGame}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-200"
              >
                Yes
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-white">🐤 ASCII Flappy</h2>
            <p className="mt-2 text-sm text-white/70">
              Press Space, W, or ArrowUp to flap. Avoid the pipes.
            </p>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/60 p-4">
              <div className="inline-block rounded-md bg-black/50 p-2 font-mono">
                {renderBoard(game).map((row, rowIndex) => (
                  <div key={`row-${rowIndex}`} className="flex">
                    {row.map((cell, cellIndex) => (
                      <span
                        key={`cell-${rowIndex}-${cellIndex}`}
                        className="inline-flex h-4 w-4 items-center justify-center text-[12px] leading-none"
                      >
                        {cell === "bird" ? "🐤" : cell === "pipe" ? "█" : "·"}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/80">
              <span>Score: {game.score}</span>
              <span>{game.isGameOver ? "Game Over" : "Flying..."}</span>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
              >
                Close
              </button>
              <button
                type="button"
                onClick={letsPlayAGame}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-200"
              >
                Restart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}