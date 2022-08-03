// @ts-nocheck
import { Server } from "Socket.IO";

const SocketHandler = (req: Request, res: Response) => {
  if (res.socket.server.io) {
    // console.log("Socket is already running");
  } else {
    console.log("Socket is initializing");
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on("connection", (socket: Socket) => {
      socket.on("join", (room) => {
        socket.join(room);
      });

      socket.on("sendOffer", ({ room, message }) => {
        socket.broadcast.to(room).emit("getOffer", message);
      });

      socket.on("sendICECandidate", ({ room, message }) => {
        socket.broadcast.to(room).emit("getICECandidate", message);
      });

      socket.on("sendAnswer", ({ room, message }) => {
        socket.broadcast.to(room).emit("getAnswer", message);
      });

      socket.on("disconnecting", (reason) => {
        for (const room of socket.rooms) {
          if (room !== socket.id) {
            socket.to(room).emit("user has left", socket.id);
          }
        }
      });
    });
  }
  res.end();
};

export default SocketHandler;
