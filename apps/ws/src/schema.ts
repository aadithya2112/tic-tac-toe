import { z } from "zod";
import { WebSocket } from "ws";

export interface Player {
  name: string;
  ws: WebSocket;
  symbol: "X" | "O";
}

export interface RoomDetails {
  gameBoard: string[][];
  players: Player[];
  currentPlayer: "X" | "O";
  gameStarted: boolean;
  gameOver: boolean;
  winner: "X" | "O" | "draw" | null;
}

export enum MessageType {
  JOIN_ROOM = "JOIN_ROOM", // done
  CREATE_ROOM = "CREATE_ROOM", // done
  LEAVE_ROOM = "LEAVE_ROOM", // done
  START_GAME = "START_GAME", // done
  MAKE_MOVE = "MAKE_MOVE", // done
  GAME_OVER = "GAME_OVER", // done
  RESET_GAME = "RESET_GAME", // done
}

export const CreateRoomSchema = z.object({
  type: z.literal(MessageType.CREATE_ROOM),
  roomId: z.string(),
  name: z.string(),
  symbol: z.enum(["X", "O"]),
});

export const JoinRoomSchema = z.object({
  type: z.literal(MessageType.JOIN_ROOM),
  roomId: z.string(),
  name: z.string(),
});

export const MakeMoveSchema = z.object({
  type: z.literal(MessageType.MAKE_MOVE),
  name: z.string(),
  roomId: z.string(),
  row: z.number(),
  col: z.number(),
});

export const LeaveRoomSchema = z.object({
  roomId: z.string(),
  name: z.string(),
});
