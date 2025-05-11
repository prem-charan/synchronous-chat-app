import { useAppStore } from "@/store";
import { HOST } from "@/utils/constants";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const socket = useRef();
  const { userInfo } = useAppStore();

  const handleReceiveMessage = useCallback((message) => {
    const {
      selectedChatData,
      selectedChatType,
      addMessage,
      addContactsInDMContacts,
    } = useAppStore.getState();

    // console.log("Received message:", message);

    if (
      selectedChatData &&
      selectedChatType === "contact" &&
      (selectedChatData._id === message.recipient._id ||
        selectedChatData._id === message.sender._id)
    ) {
      addMessage(message);
    }
    addContactsInDMContacts(message);
  }, []);

  const handleReceiveChannelMessage = (message) => {
    const {
      selectedChatData,
      selectedChatType,
      addMessage,
      addChannelInChannelList,
    } = useAppStore.getState();

    if (
      selectedChatType !== undefined &&
      selectedChatData._id === message.channelId
    ) {
      addMessage(message);
    }
    addChannelInChannelList(message);
  };

  useEffect(() => {
    if (!userInfo?.id) return;

    socket.current = io(HOST, {
      withCredentials: true,
      query: { userId: userInfo.id },
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      extraHeaders: {
        "x-auth-token": localStorage.getItem("auth_token"),
      },
    });

    socket.current.on("connect", () => {
      console.log("Socket connected successfully");
    });

    socket.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.current.on("receiveMessage", handleReceiveMessage);
    socket.current.on("receive-channel-message", handleReceiveChannelMessage);

    return () => {
      if (socket.current) {
        socket.current.off("receiveMessage", handleReceiveMessage);
        socket.current.disconnect();
      }
    };
  }, [userInfo?.id, handleReceiveMessage]);

  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  );
};
