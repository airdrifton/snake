import { useEffect, useRef, useCallback } from 'react';
import { useSnakeGame, Direction } from './hooks/useSnakeGame';

function App() {
  const {
    snake,
    food,
    gameState,
    score,
    highScore,
    difficulty,
    gridSize,
    startGame,
    togglePause,
    changeDirection,
    changeDifficulty,
  } = useSnakeGame();

  const boardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        W: 'UP',
        s: 'DOWN',
        S: 'DOWN',
        a: 'LEFT',
        A: 'LEFT',
        d: 'RIGHT',
        D: 'RIGHT',
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        if (gameState === 'playing') {
          changeDirection(keyMap[e.key]);
        }
      }

      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (gameState === 'playing' || gameState === 'paused') {
          togglePause();
        }
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (gameState === 'idle' || gameState === 'gameover') {
          startGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, changeDirection, togglePause, startGame]);

  // Touch controls (swipe)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minSwipe = 30;

    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      changeDirection(dy > 0 ? 'DOWN' : 'UP');
    }

    touchStartRef.current = null;
  }, [changeDirection]);

  // Render grid cells
  const renderBoard = () => {
    const cells = [];
    const snakeSet = new Map<string, number>();
    
    snake.forEach((seg, index) => {
      snakeSet.set(`${seg.x},${seg.y}`, index);
    });

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const key = `${x},${y}`;
        const snakeIndex = snakeSet.get(key);
        const isFood = food.x === x && food.y === y;
        
        let cellClass = 'cell';
        
        if (snakeIndex !== undefined) {
          if (snakeIndex === 0) {
            cellClass += ' cell-snake-head';
          } else if (snakeIndex === snake.length - 1) {
            cellClass += ' cell-snake-tail';
          } else {
            cellClass += ' cell-snake-body';
          }
        } else if (isFood) {
          cellClass += ' cell-food';
        }

        cells.push(
          <div
            key={key}
            className={cellClass}
            style={{ aspectRatio: '1' }}
          />
        );
      }
    }

    return cells;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
      {/* Header */}
      <div className="text-center animate-slide-up">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
          🐍 Змейка
        </h1>
        <p className="text-sm text-white/50">
          Стрелки / WASD • Пробел — пауза
        </p>
      </div>

      {/* Score Panel */}
      <div className="flex gap-3 md:gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="score-display text-center">
          <div className="text-xs text-white/50 uppercase tracking-wider">Счёт</div>
          <div className="text-2xl font-bold text-cyan-400">{score}</div>
        </div>
        <div className="score-display text-center">
          <div className="text-xs text-white/50 uppercase tracking-wider">Рекорд</div>
          <div className="text-2xl font-bold text-purple-400">{highScore}</div>
        </div>
      </div>

      {/* Difficulty Selector */}
      <div className="flex gap-2 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        {(['easy', 'medium', 'hard'] as const).map((diff) => {
          const labels = { easy: 'Легко', medium: 'Средне', hard: 'Сложно' };
          return (
            <button
              key={diff}
              onClick={() => changeDifficulty(diff)}
              className={`difficulty-btn ${difficulty === diff ? 'active' : ''}`}
              disabled={gameState === 'playing' || gameState === 'paused'}
            >
              {labels[diff]}
            </button>
          );
        })}
      </div>

      {/* Game Board */}
      <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div
          ref={boardRef}
          className="game-board"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            width: 'min(85vw, 480px)',
            height: 'min(85vw, 480px)',
            '--cols': gridSize,
            '--rows': gridSize,
          } as React.CSSProperties}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {renderBoard()}

          {/* Idle Overlay */}
          {gameState === 'idle' && (
            <div className="overlay">
              <div className="text-5xl mb-4">🐍</div>
              <h2 className="text-xl font-bold text-white mb-2">Готовы играть?</h2>
              <p className="text-sm text-white/60 mb-4">
                {difficulty === 'easy' ? 'Лёгкий режим' : difficulty === 'medium' ? 'Средний режим' : 'Сложный режим'}
              </p>
              <button onClick={startGame} className="btn-game btn-primary px-6 py-3 text-lg">
                ▶ Начать игру
              </button>
              <p className="text-xs text-white/40 mt-3">или нажмите Enter</p>
            </div>
          )}

          {/* Paused Overlay */}
          {gameState === 'paused' && (
            <div className="overlay">
              <div className="text-4xl mb-4">⏸️</div>
              <h2 className="text-xl font-bold text-white mb-4">Пауза</h2>
              <button onClick={togglePause} className="btn-game btn-primary px-6 py-3">
                ▶ Продолжить
              </button>
              <p className="text-xs text-white/40 mt-3">Пробел / Esc</p>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === 'gameover' && (
            <div className="overlay">
              <div className="text-4xl mb-4">💀</div>
              <h2 className="text-xl font-bold text-white mb-2">Игра окончена!</h2>
              <p className="text-lg text-cyan-400 font-bold mb-1">Счёт: {score}</p>
              {score >= highScore && score > 0 && (
                <p className="text-sm text-yellow-400 mb-2">🏆 Новый рекорд!</p>
              )}
              <p className="text-sm text-white/60 mb-4">Рекорд: {highScore}</p>
              <button onClick={startGame} className="btn-game btn-primary px-6 py-3">
                🔄 Играть снова
              </button>
              <p className="text-xs text-white/40 mt-3">или нажмите Enter</p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 animate-slide-up" style={{ animationDelay: '0.25s' }}>
        {gameState === 'playing' && (
          <button onClick={togglePause} className="btn-game">
            ⏸ Пауза
          </button>
        )}
        {gameState === 'paused' && (
          <button onClick={togglePause} className="btn-game btn-primary">
            ▶ Продолжить
          </button>
        )}
        {(gameState === 'playing' || gameState === 'paused') && (
          <button onClick={startGame} className="btn-game btn-danger">
            🔄 Заново
          </button>
        )}
      </div>

      {/* Touch D-Pad Controls */}
      <div
        className="touch-controls grid-cols-3 gap-2 mt-2 animate-slide-up"
        style={{ animationDelay: '0.3s' }}
      >
        <div></div>
        <button
          className="touch-btn"
          onTouchStart={(e) => { e.preventDefault(); changeDirection('UP'); }}
        >
          ↑
        </button>
        <div></div>
        <button
          className="touch-btn"
          onTouchStart={(e) => { e.preventDefault(); changeDirection('LEFT'); }}
        >
          ←
        </button>
        <button
          className="touch-btn"
          onTouchStart={(e) => { e.preventDefault(); togglePause(); }}
        >
          {gameState === 'playing' ? '⏸' : '▶'}
        </button>
        <button
          className="touch-btn"
          onTouchStart={(e) => { e.preventDefault(); changeDirection('RIGHT'); }}
        >
          →
        </button>
        <div></div>
        <button
          className="touch-btn"
          onTouchStart={(e) => { e.preventDefault(); changeDirection('DOWN'); }}
        >
          ↓
        </button>
        <div></div>
      </div>

      {/* Footer hint */}
      <div className="text-xs text-white/30 text-center mt-2">
        Свайпайте на мобильном • D-Pad для управления
      </div>
    </div>
  );
}

export default App;
