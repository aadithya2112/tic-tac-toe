"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import FormInput from "@/components/Form";
import GameBoard from "@/components/GameBoard";

export default function Home() {
  const wsRef = useRef<WebSocket | null>(null);
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [symbol, setSymbol] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    wsRef.current = ws;

    ws.onopen = () => {
      toast.success("Connected to WebSocket server");
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // console.log("Received message:", message);

      if (!message.success) {
        toast.error(message.error);
        return;
      }

      if (message.success) {
        toast.success(message.message);
      }
    };

    ws.onerror = (error) => {
      toast.error("WebSocket error");
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  function handleCreateRoom() {
    if (!username || !symbol) {
      toast.error("Username and symbol and roomId are required");
      return;
    }
    const randomRoomId = Math.random().toString(36).substring(2, 8);
    setRoomId(randomRoomId);
    const createRoomMessage = {
      type: "CREATE_ROOM",
      name: username,
      symbol: symbol,
      roomId: randomRoomId,
    };

    wsRef.current?.send(JSON.stringify(createRoomMessage));
    toast.success("Room creation request sent");
    setJoinedRoom(true);
  }

  function handleJoinRoom() {
    if (!username || !roomId) {
      toast.error("All fields are required to join a room");
      return;
    }

    const joinRoomMessage = {
      type: "JOIN_ROOM",
      name: username,
      roomId,
    };

    wsRef.current?.send(JSON.stringify(joinRoomMessage));
    toast.success("Join room request sent");
    setJoinedRoom(true);
  }

  return (
    <main className="bg-black min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      {joinedRoom ? (
        <GameBoard
          roomId={roomId}
          symbol={symbol}
          username={username}
          ws={wsRef.current}
        />
      ) : (
        <FormInput
          username={username}
          setUsername={setUsername}
          roomId={roomId}
          setRoomId={setRoomId}
          symbol={symbol}
          setSymbol={setSymbol}
          handleCreateRoom={handleCreateRoom}
          handleJoinRoom={handleJoinRoom}
        />
      )}
    </main>
  );
}
