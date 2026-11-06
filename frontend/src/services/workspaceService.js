// MOCK workspace service. In Phase 3/4 this calls the real backend.
import { getRooms } from "./roomService";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const STARTER_FILES = {
  JavaScript: { name: "main.js", content: 'console.log("Hello, CodeSync!");\n' },
  TypeScript: { name: "main.ts", content: 'console.log("Hello, CodeSync!");\n' },
  Python: { name: "main.py", content: 'print("Hello, CodeSync!")\n' },
  Java: {
    name: "Main.java",
    content:
      'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, CodeSync!");\n  }\n}\n',
  },
  "C++": {
    name: "main.cpp",
    content:
      '#include <iostream>\n\nint main() {\n  std::cout << "Hello, CodeSync!" << std::endl;\n  return 0;\n}\n',
  },
};

const MOCK_PARTICIPANTS = [
  { id: "p1", name: "Priya", role: "editor", online: true },
  { id: "p2", name: "Rahul", role: "editor", online: true },
  { id: "p3", name: "Anita", role: "viewer", online: false },
];

export async function getWorkspace(roomId) {
  await delay(600);
  const rooms = await getRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) throw new Error("Room not found");

  const starter = STARTER_FILES[room.language] ?? STARTER_FILES.JavaScript;
  const files = [
    { id: crypto.randomUUID(), name: starter.name, content: starter.content },
    { id: crypto.randomUUID(), name: "notes.txt", content: "Write your notes here.\n" },
  ];

  return { room, files, participants: MOCK_PARTICIPANTS };
}