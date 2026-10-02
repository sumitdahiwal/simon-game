import { useEffect, useRef, useState } from "react";
import "./App.css";

const COLORS = ["red", "green", "blue", "yellow"];

const FREQUENCIES = {
  red: 329.63,
  green: 261.63,
  blue: 392.0,
  yellow: 523.25,
};

function App() {
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [level, setLevel] = useState(0);
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("simonHighScore")) || 0
  );
  const [gameState, setGameState] = useState("ready");
  const [activeColor, setActiveColor] = useState(null);
  const [message, setMessage] = useState("Ready when you are");

  const audioContext = useRef(null);

  const playSound = (color, duration = 180) => {
    try {
      if (!audioContext.current) {
        audioContext.current = new (
          window.AudioContext || window.webkitAudioContext
        )();
      }

      const oscillator = audioContext.current.createOscillator();
      const gain = audioContext.current.createGain();

      oscillator.frequency.value = FREQUENCIES[color];
      oscillator.type = "sine";

      gain.gain.setValueAtTime(0.0001, audioContext.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.18,
        audioContext.current.currentTime + 0.01
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.current.currentTime + duration / 1000
      );

      oscillator.connect(gain);
      gain.connect(audioContext.current.destination);

      oscillator.start();
      oscillator.stop(
        audioContext.current.currentTime + duration / 1000 + 0.02
      );
    } catch {
      // Audio is optional if the browser blocks it.
    }
  };

  const flashColor = (color, duration = 400) => {
    setActiveColor(color);
    playSound(color, duration);

    setTimeout(() => {
      setActiveColor(null);
    }, duration);
  };

  const playSequence = async (newSequence) => {
    setGameState("watching");
    setMessage("Watch the sequence...");

    await new Promise((resolve) => setTimeout(resolve, 700));

    for (const color of newSequence) {
      flashColor(color, 430);
      await new Promise((resolve) => setTimeout(resolve, 650));
    }

    setUserSequence([]);
    setGameState("playing");
    setMessage("Your turn");
  };

  const startGame = () => {
    const firstColor =
      COLORS[Math.floor(Math.random() * COLORS.length)];

    const newSequence = [firstColor];

    setSequence(newSequence);
    setUserSequence([]);
    setLevel(1);
    setGameState("watching");
    setMessage("Watch the sequence...");

    playSequence(newSequence);
  };

  const nextLevel = () => {
    const nextColor =
      COLORS[Math.floor(Math.random() * COLORS.length)];

    const newSequence = [...sequence, nextColor];

    setSequence(newSequence);
    setUserSequence([]);
    setLevel(newSequence.length);

    if (newSequence.length > highScore) {
      setHighScore(newSequence.length);

      localStorage.setItem(
        "simonHighScore",
        newSequence.length
      );
    }

    playSequence(newSequence);
  };

  const handleColorClick = (color) => {
    if (gameState !== "playing") return;

    flashColor(color, 160);

    const currentIndex = userSequence.length;

    if (color !== sequence[currentIndex]) {
      setGameState("gameover");
      setActiveColor(null);
      setMessage("Wrong sequence");
      return;
    }

    const newUserSequence = [...userSequence, color];

    setUserSequence(newUserSequence);

    if (newUserSequence.length === sequence.length) {
      setGameState("success");
      setMessage("Perfect!");

      setTimeout(() => {
        nextLevel();
      }, 900);
    }
  };

  useEffect(() => {
    if (gameState === "success") {
      const timer = setTimeout(() => {
        setMessage("Get ready...");
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [gameState]);

  return (
    <main className="app">
      <div className="background-glow glow-one"></div>
      <div className="background-glow glow-two"></div>

      <section className="game-container">
        <header className="header">
          <div className="brand">
            <div className="brand-icon">S</div>

            <div>
              <h1>SIMON</h1>
              <p>MEMORY CHALLENGE</p>
            </div>
          </div>

          <div className="status-pill">
            <span
              className={`status-dot ${
                gameState === "playing"
                  ? "active"
                  : gameState === "watching"
                  ? "watching"
                  : ""
              }`}
            ></span>

            {gameState === "ready"
              ? "READY"
              : gameState === "watching"
              ? "WATCH"
              : gameState === "playing"
              ? "YOUR TURN"
              : gameState === "success"
              ? "NICE"
              : "GAME OVER"}
          </div>
        </header>

        <div className="stats">
          <div className="stat-card">
            <span className="stat-label">LEVEL</span>
            <strong>{level.toString().padStart(2, "0")}</strong>
          </div>

          <div className="stat-card featured">
            <span className="stat-label">HIGH SCORE</span>
            <strong>{highScore.toString().padStart(2, "0")}</strong>
          </div>

          <div className="stat-card">
            <span className="stat-label">PROGRESS</span>
            <strong>
              {sequence.length
                ? `${userSequence.length}/${sequence.length}`
                : "—"}
            </strong>
          </div>
        </div>

        <div className="game-area">
          <div className="simon-board">
            {COLORS.map((color) => (
              <button
                key={color}
                className={`color-button ${color} ${
                  activeColor === color ? "lit" : ""
                }`}
                onClick={() => handleColorClick(color)}
                disabled={gameState !== "playing"}
                aria-label={`${color} button`}
              >
                <span className="button-inner"></span>
              </button>
            ))}

            <div className="center-logo">
              <span>SIMON</span>
              <small>MEMORY</small>
            </div>
          </div>
        </div>

        <div className="game-message">
          <div className="message-line"></div>

          <div>
            <h2>{message}</h2>

            <p>
              {gameState === "ready"
                ? "Repeat the pattern and beat your high score"
                : gameState === "watching"
                ? "Remember every color in order"
                : gameState === "playing"
                ? "Tap the colors in the same order"
                : gameState === "success"
                ? "Excellent memory. Next level incoming"
                : "Don't worry — try again and beat your score"}
            </p>
          </div>

          <div className="message-line"></div>
        </div>

        <div className="controls">
          {gameState === "ready" || gameState === "gameover" ? (
            <button className="start-button" onClick={startGame}>
              <span className="play-icon">▶</span>
              {gameState === "gameover"
                ? "PLAY AGAIN"
                : "START GAME"}
            </button>
          ) : (
            <div className="playing-indicator">
              <span></span>
              GAME IN PROGRESS
            </div>
          )}
        </div>

        <footer>
          <span>MEMORY • FOCUS • PRECISION</span>
          <span>BEST: LEVEL {highScore}</span>
        </footer>

        <div className="creator-credit">
          <span className="credit-line"></span>

          <div className="creator-content">
            <span className="created-text">CRAFTED WITH ♡ BY</span>
            <span className="creator-name">CHAITU</span>
          </div>

          <span className="credit-line"></span>
        </div>
      </section>
    </main>
  );
}

export default App;