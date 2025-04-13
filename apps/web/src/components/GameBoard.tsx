"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type GameBoardProps = {
  roomId: string;
  symbol: string;
  username: string;
  ws: WebSocket | null;
};

export default function GameBoard({
  roomId,
  symbol,
  username,
  ws,
}: GameBoardProps) {
  const [players, setPlayers] = useState(() =>
    symbol ? [{ name: username, symbol: symbol, isYou: true }] : []
  );

  const [gameBoard, setGameBoard] = useState<string[][]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [userSymbol, setUserSymbol] = useState(symbol);

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Received message:", message);

        // {
        //     "succes": true,
        //     "message": "PLAYER_JOINED",
        //     "player": {
        //         "name": "adfads",
        //         "symbol": "X"
        //     }
        // }

        if (message.message === "PLAYER_JOINED") {
          alert("Player joined");
          const newPlayer = {
            name: message.player.name,
            symbol: message.player.symbol,
            isYou: message.player.name === username,
          };

          // If this is about you, update your symbol
          if (newPlayer.isYou) {
            setUserSymbol(message.player.symbol);
          }

          setPlayers((prevPlayers) => {
            const existingPlayer = prevPlayers.find(
              (player) => player.name === newPlayer.name
            );
            if (!existingPlayer) {
              return [...prevPlayers, newPlayer];
            }
            return prevPlayers;
          });
        }

        if (message.message === "OTHER_PLAYER") {
          const newPlayer = {
            name: message.player.name,
            symbol: message.player.symbol,
            isYou: message.player.name === username,
          };

          // If this is about you, update your symbol
          if (newPlayer.isYou) {
            setUserSymbol(message.player.symbol);
          }

          setPlayers((prevPlayers) => {
            const existingPlayer = prevPlayers.find(
              (player) => player.name === newPlayer.name
            );
            if (!existingPlayer) {
              return [...prevPlayers, newPlayer];
            }
            return prevPlayers;
          });
        }

        if (message.message === "PLAYER_DISCONNECTED") {
          setPlayers((prevPlayers) =>
            prevPlayers.filter((player) => player.name !== message.player.name)
          );
        }

        // {"success":true,"message":"GAME_STARTED","gameBoard":[[null,null,null],[null,null,null],[null,null,null]],"currentPlayer":"X"}
        if (message.message === "GAME_STARTED") {
          setGameBoard(message.gameBoard);
          setGameStarted(true);
          setGameOver(false);
          setWinner(null);

          console.log("Current player:", message.currentPlayer);
          console.log("Your symbol:", userSymbol);
          setIsYourTurn(message.currentPlayer === userSymbol);
        }

        if (message.message === "MOVE_MADE") {
          setGameBoard(message.gameBoard);
          console.log("Player symbol in move made:", message.currentPlayer);
          console.log("Your symbol:", userSymbol);
          setIsYourTurn(message.currentPlayer === userSymbol);
        }

        // Handle game over message if server sends it
        if (message.message === "GAME_OVER") {
          setGameOver(true);
          setWinner(message.winner || null);
          setIsYourTurn(false);
        }
      };
    }

    return () => {
      // Clean up websocket listener on component unmount or dependencies change
      if (ws) {
        ws.onmessage = null;
      }
    };
  }, [ws, username, userSymbol]);

  const handleStartGame = () => {
    console.log("Start Game button clicked!");

    const startGameMessage = {
      type: "START_GAME",
      roomId: roomId,
    };
    ws?.send(JSON.stringify(startGameMessage));
  };

  const handleResetGame = () => {
    const resetGameMessage = {
      type: "RESET_GAME",
      roomId: roomId,
    };
    ws?.send(JSON.stringify(resetGameMessage));
  };

  const handleCellClick = (row: number, col: number) => {
    // Don't allow clicking on already filled cells
    if (gameBoard[row][col] || !isYourTurn || gameOver) {
      if (!isYourTurn) {
        toast.error("It's not your turn.");
      } else if (gameOver) {
        toast.error("The game is over.");
      }
      return;
    }

    console.log("Cell clicked:", row, col);
    console.log("Using symbol:", userSymbol);

    // Optimistically update the UI
    const newGameBoard = JSON.parse(JSON.stringify(gameBoard)); // Deep copy
    newGameBoard[row][col] = userSymbol;
    setGameBoard(newGameBoard);
    setIsYourTurn(false);

    const makeMoveMessage = {
      type: "MAKE_MOVE",
      name: username,
      roomId: roomId,
      row: row,
      col: col,
    };
    ws?.send(JSON.stringify(makeMoveMessage));
  };

  return (
    <div className="bg-zinc-900 p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6 text-white">
      <h2 className="text-2xl font-bold text-center mb-6">Room ID: {roomId}</h2>

      {/* Players List */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold">Players:</h3>
        <ul className="list-disc pl-6">
          {players.map((player, index) => (
            <li
              key={index}
              className={player.isYou ? "text-green-400 font-bold" : ""}
            >
              {player.name} ({player.symbol}) {player.isYou ? "(You)" : ""}
            </li>
          ))}
        </ul>
      </div>

      {/* Your Symbol */}
      <div className="text-center">
        <p>Your symbol: {userSymbol || "Not assigned yet"}</p>
      </div>

      {/* Start Game Button */}
      {!gameStarted && (
        <div className="text-center">
          <button
            onClick={handleStartGame}
            className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all"
            disabled={players.length < 2}
          >
            Start Game
          </button>
          {players.length < 2 && (
            <p className="mt-2 text-yellow-400">
              Waiting for opponent to join...
            </p>
          )}
        </div>
      )}

      {gameOver && (
        <div className="text-center">
          <h3 className="text-lg font-bold">
            Game Over! {winner ? `${winner} wins!` : "It's a draw!"}
          </h3>
          <button
            onClick={handleResetGame}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all mt-4"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Tic Tac Toe Board */}
      <div className="grid grid-cols-3 gap-2 aspect-square">
        {gameBoard.length > 0
          ? // Render the game board using the 2D array
            gameBoard.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={`w-full h-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-3xl font-bold ${
                    !cell && isYourTurn && !gameOver
                      ? "cursor-pointer hover:bg-zinc-700"
                      : "cursor-default"
                  } transition-all`}
                >
                  {cell}
                </div>
              ))
            )
          : // Fallback when gameBoard is empty
            Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="w-full h-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-3xl font-bold cursor-default"
              >
                {/* Empty cell */}
              </div>
            ))}
      </div>

      {gameStarted && !gameOver && (
        <div className="text-center mt-4">
          <p
            className="text-lg font-bold"
            style={{ color: isYourTurn ? "#4ADE80" : "#F87171" }}
          >
            {isYourTurn ? "Your turn" : "Waiting for opponent's move..."}
          </p>
        </div>
      )}
    </div>
  );
}
