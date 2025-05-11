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
import { toast } from "sonner";

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
      timeout: 10000,
      extraHeaders: {
        "x-auth-token": localStorage.getItem("auth_token"),
      },
    });

    socket.current.on("connect", () => {
      console.log("Socket connected successfully");
    });

    socket.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Connection error. Please check your internet connection.");
    });

    socket.current.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server initiated disconnect, try to reconnect
        socket.current.connect();
      }
    });

    socket.current.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Attempting to reconnect (${attemptNumber}/5)`);
    });

    socket.current.on("reconnect_failed", () => {
      console.error("Failed to reconnect to socket server");
      toast.error("Failed to establish connection. Please refresh the page.");
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
