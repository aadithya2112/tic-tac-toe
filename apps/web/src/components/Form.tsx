"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

type FormProps = {
  username: string;
  setUsername: (username: string) => void;
  roomId: string;
  setRoomId: (roomId: string) => void;
  symbol: string;
  setSymbol: (symbol: string) => void;
  handleCreateRoom: () => void;
  handleJoinRoom: () => void;
};

export default function FormInput({
  username,
  setUsername,
  roomId,
  setRoomId,
  symbol,
  setSymbol,
  handleCreateRoom,
  handleJoinRoom,
}: FormProps) {
  return (
    <>
      <h1 className="text-white text-3xl font-bold mb-4">Tic Tac Toe</h1>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <label className="text-white">Username</label>
        <Input
          placeholder="Enter your username"
          className="text-white"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label className="text-white">Choose your symbol</label>
        <Select onValueChange={(value) => setSymbol(value)}>
          <SelectTrigger className="text-white">
            <SelectValue placeholder="Select X or O" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="X">X</SelectItem>
            <SelectItem value="O">O</SelectItem>
          </SelectContent>
        </Select>

        <Button
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={handleCreateRoom}
        >
          Create Room
        </Button>

        <label className="text-white mt-4">Room ID</label>
        <Input
          placeholder="Enter Room ID"
          className="text-white"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleJoinRoom}
        >
          Join Room
        </Button>
      </div>
    </>
  );
}
