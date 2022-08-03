import { useRouter } from "next/router";
import { useEffect } from "react";
import { io } from "socket.io-client";

let socket;

export const Room = () => {
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

  const router = useRouter();
  const { room } = router.query;

  const ioclient = io("http://localhost:3000");

  let localStream: MediaStream;
  let remoteStream: MediaStream;
  let peerConnection: RTCPeerConnection;

  const servers = {
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  };

  const createPeerConnection = async () => {
    if (!localStream && typeof window !== "undefined") {
      localStream = await window.navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      (document.querySelector("#user-1") as HTMLMediaElement).srcObject =
        localStream;
    }

    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    (document.querySelector("#user-2") as HTMLMediaElement).srcObject =
      remoteStream;

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        ioclient.emit("sendICECandidate", { room, message: event.candidate });
      }
    };
  };

  const createOffer = async () => {
    await createPeerConnection();

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    return offer;
  };

  const createAnswer = async (offer: RTCSessionDescriptionInit) => {
    await createPeerConnection();

    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    ioclient.emit("sendAnswer", { room, tipo: "answer", message: answer });
  };

  const addAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnection.currentRemoteDescription) {
      peerConnection.setRemoteDescription(answer);
    }
  };

  ioclient.on("connect", async () => {
    if (typeof window == "undefined") return;
    ioclient.emit("join", room);
    ioclient.emit("sendOffer", { room, message: await createOffer() });

    ioclient.on("getOffer", (message: RTCSessionDescriptionInit) => {
      createAnswer(message);
    });

    ioclient.on("getICECandidate", (message: RTCIceCandidateInit) => {
      if (peerConnection) {
        // console.warn(message);

        peerConnection.addIceCandidate(message);
      }
    });

    ioclient.on("getAnswer", (message: RTCSessionDescriptionInit) => {
      addAnswer(message);
    });
  });

  return (
    <div
      id="mainContainer"
      className="flex items-center justify-center w-screen h-screen bg-slate-100"
    >
      <div id="videos" className="grid grid-cols-2 gap-8">
        <video
          id="user-1"
          className="w-full bg-black video-player h-80"
          autoPlay
          playsInline
        />
        <video
          id="user-2"
          className="w-full bg-black video-player h-80"
          autoPlay
          playsInline
        />
      </div>
    </div>
  );
};

export default Room;
