import { useEffect } from "react";
import io from "Socket.IO-client";
let socket;

const Home = () => {
  useEffect(() => {
    (async () => {
      await socketInitializer();
    })();
  }, []);

  const socketInitializer = async () => {
    await fetch("/api/socket");
    socket = io();

    socket.on("connect", () => {
      console.log("connected");
    });

    return;
  };

  return (
    <>
      
    </>
  );
};

export default Home;
