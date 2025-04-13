import { WebSocket, WebSocketServer } from "ws";
import {
  CreateRoomSchema,
  JoinRoomSchema,
  LeaveRoomSchema,
  MakeMoveSchema,
  MessageType,
  Player,
  RoomDetails,
} from "./schema";

const rooms: Record<string, RoomDetails> = {};

const wss = new WebSocketServer({ port: 8080 });

function notifyRoom(roomId: string, message: string) {
  const room = rooms[roomId];
  if (!room) return;

  room.players.forEach((player) => {
    console.log("Sending message to player:", player.name, message);
    player.ws.send(message);
  });
}

function checkGameOver(room: RoomDetails): boolean {
  const board = room.gameBoard!;
  const playerPlayed = room.currentPlayer === "X" ? "O" : "X";

  // Check rows
  for (let i = 0; i < 3; i++) {
    if (
      board[i]![0] === playerPlayed &&
      board[i]![1] === playerPlayed &&
      board[i]![2] === playerPlayed
    ) {
      room.gameOver = true;
      room.winner = playerPlayed;
      return true;
    }
  }

  // Check columns
  for (let i = 0; i < 3; i++) {
    if (
      board[0]![i] === playerPlayed &&
      board[1]![i] === playerPlayed &&
      board[2]![i] === playerPlayed
    ) {
      room.gameOver = true;
      room.winner = playerPlayed;
      return true;
    }
  }

  // Check diagonals
  if (
    board[0]![0] === playerPlayed &&
    board[1]![1] === playerPlayed &&
    board[2]![2] === playerPlayed
  ) {
    room.gameOver = true;
    room.winner = playerPlayed;
    return true;
  }
  if (
    board[0]![2] === playerPlayed &&
    board[1]![1] === playerPlayed &&
    board[2]![0] === playerPlayed
  ) {
    room.gameOver = true;
    room.winner = playerPlayed;
    return true;
  }

  // Check for draw
  const isDraw = board.every((row) => row!.every((cell) => cell !== null));
  if (isDraw) {
    room.gameOver = true;
    room.winner = "draw";
    return true;
  }

  return false;
}

function handleCreateRoom(ws: WebSocket, data: any) {
  const result = CreateRoomSchema.safeParse(data);
  if (!result.success) {
    ws.send(JSON.stringify({ error: "Invalid data" }));
    return;
  }
  const { roomId, name, symbol } = result.data;

  if (rooms[roomId]) {
    ws.send(JSON.stringify({ success: false, error: "Room already exists" }));
    return;
  }

  rooms[roomId] = {
    gameBoard: Array.from({ length: 3 }, () => Array(3).fill(null)),
    players: [],
    currentPlayer: symbol,
    gameStarted: false,
    gameOver: false,
    winner: null,
  };
  const player: Player = { name, ws, symbol };
  rooms[roomId].players.push(player);
  ws.send(JSON.stringify({ success: true, message: "ROOM_CREATED" }));
}

function handleJoinRoom(ws: WebSocket, data: any) {
  const joinRoomResult = JoinRoomSchema.safeParse(data);
  if (!joinRoomResult.success) {
    ws.send(JSON.stringify({ sucess: false, error: "Invalid data" }));
    return;
  }
  const { roomId, name } = joinRoomResult.data;

  const room = rooms[roomId];
  if (!room) {
    ws.send(JSON.stringify({ sucess: false, error: "Room not found" }));
    return;
  }

  if (room.players.length >= 2) {
    ws.send(JSON.stringify({ sucess: false, error: "Room is full" }));
    return;
  }
  const symbol = room.players[0]?.symbol === "X" ? "O" : "X";
  const player: Player = { name, ws, symbol };
  room.players.push(player);
  ws.send(JSON.stringify({ success: true, message: "JOINED_ROOM" }));

  const sendMessage = {
    succes: true,
    message: "PLAYER_JOINED",
    player: {
      name,
      symbol,
    },
  };
  notifyRoom(roomId, JSON.stringify(sendMessage));
}

function handleStartGame(ws: WebSocket, data: any) {
  const roomId = data.roomId;
  const room = rooms[roomId];
  if (!room) {
    ws.send(JSON.stringify({ success: false, error: "Room not found" }));
    return;
  }
  if (room.gameStarted) {
    ws.send(JSON.stringify({ success: false, error: "Game already started" }));
    return;
  }
  if (room.players.length < 2) {
    ws.send(JSON.stringify({ success: false, error: "Not enough players" }));
    return;
  }
  room.gameStarted = true;
  room.currentPlayer = "X";

  room.gameOver = false;
  room.winner = null;

  const startGameMessage = {
    success: true,
    message: "GAME_STARTED",
    gameBoard: room.gameBoard,
    currentPlayer: room.currentPlayer,
  };
  notifyRoom(roomId, JSON.stringify(startGameMessage));
}

function handleMakeMove(ws: WebSocket, data: any) {
  const result = MakeMoveSchema.safeParse(data);
  if (!result.success) {
    ws.send(JSON.stringify({ sucess: false, error: "Invalid data" }));
    return;
  }
  const { roomId, row, col, name } = result.data;

  // check if current player is the one making the move
  const room = rooms[roomId];
  if (!room) {
    ws.send(JSON.stringify({ success: false, error: "Room not found" }));
    return;
  }
  if (!room.gameStarted) {
    ws.send(JSON.stringify({ success: false, error: "Game not started" }));
    return;
  }

  if (room.gameOver) {
    ws.send(JSON.stringify({ success: false, error: "Game over" }));
    return;
  }

  if (
    room.currentPlayer !== room.players.find((p) => p.name === name)?.symbol
  ) {
    ws.send(JSON.stringify({ success: false, error: "Not your turn" }));
    return;
  }

  // check if move is valid
  if (row < 0 || row > 2 || col < 0 || col > 2) {
    ws.send(JSON.stringify({ success: false, error: "Invalid move" }));
    return;
  }

  // make sure gameboard is not null
  if (!room.gameBoard) {
    ws.send(JSON.stringify({ success: false, error: "Gameboard not found" }));
    return;
  }
  if ((room.gameBoard ?? [])[row]?.[col] !== null) {
    ws.send(JSON.stringify({ success: false, error: "Invalid move" }));
    return;
  }

  if (room.gameBoard && room.gameBoard[row]) {
    console.log("Making move", row, col, room.currentPlayer);
    room.gameBoard[row][col] = room.currentPlayer;
  }

  room.currentPlayer = room.currentPlayer === "X" ? "O" : "X";
  const moveMessage = {
    success: true,
    message: "MOVE_MADE",
    gameBoard: room.gameBoard,
    currentPlayer: room.currentPlayer,
  };
  notifyRoom(roomId, JSON.stringify(moveMessage));
  // check if game is over

  const isGameOver = checkGameOver(room);
  if (isGameOver) {
    const gameOverMessage = {
      success: true,
      message: "GAME_OVER",
      winner: room.winner,
    };
    notifyRoom(roomId, JSON.stringify(gameOverMessage));
  }
}

function handleLeaveRoom(ws: WebSocket, data: any) {
  const result = LeaveRoomSchema.safeParse(data);
  if (!result.success) {
    ws.send(JSON.stringify({ success: false, error: "Invalid data" }));
    return;
  }
  const { roomId, name } = result.data;
  const room = rooms[roomId];
  if (!room) {
    ws.send(JSON.stringify({ success: false, error: "Room not found" }));
    return;
  }
  const playerIndex = room.players.findIndex((p) => p.name === name);
  if (playerIndex === -1) {
    ws.send(JSON.stringify({ success: false, error: "Player not found" }));
    return;
  }
  room.players.splice(playerIndex, 1);

  if (room.players.length === 0) {
    delete rooms[roomId];
    ws.send(JSON.stringify({ success: true, message: "ROOM_DELETED" }));
  } else {
    ws.send(JSON.stringify({ success: true, message: "PLAYER_LEFT" }));
  }
}

function handleResetGame(ws: WebSocket, data: any) {
  const roomId = data.roomId;
  const room = rooms[roomId];
  if (!room) {
    ws.send(JSON.stringify({ success: false, error: "Room not found" }));
    return;
  }
  room.gameBoard = Array.from({ length: 3 }, () => Array(3).fill(null));
  room.gameOver = false;
  room.winner = null;
  room.currentPlayer = "X";
  const resetMessage = {
    success: true,
    message: "GAME_RESET",
    gameBoard: room.gameBoard,
    currentPlayer: room.currentPlayer,
  };

  notifyRoom(roomId, JSON.stringify(resetMessage));
}

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", (message: string) => {
    const data = JSON.parse(message.toString());

    switch (data.type) {
      case MessageType.CREATE_ROOM:
        handleCreateRoom(ws, data);
        break;

      case MessageType.JOIN_ROOM:
        handleJoinRoom(ws, data);
        break;

      case MessageType.START_GAME:
        // check if roomId in data
        handleStartGame(ws, data);
        break;

      case MessageType.MAKE_MOVE:
        handleMakeMove(ws, data);
        break;

      case MessageType.LEAVE_ROOM:
        handleLeaveRoom(ws, data);
        break;

      case MessageType.RESET_GAME:
        handleResetGame(ws, data);
        break;
      default:
        ws.send(
          JSON.stringify({ success: false, error: "Invalid message type" })
        );
        break;
    }
  });

  ws.on("close", () => {
    // Iterate through all rooms
    for (const roomId in rooms) {
      const room = rooms[roomId];

      if (!room) continue;

      // Filter out the player with the disconnected ws
      room.players = room.players.filter((player) => player.ws !== ws);

      // Optionally: Remove the room if it becomes empty
      if (room.players.length === 0) {
        delete rooms[roomId];
        console.log(`Room ${roomId} has been deleted due to no players.`);
      }
    }
    console.log("A WebSocket connection has been closed.");
  });
});
