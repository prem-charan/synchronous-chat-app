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
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const handleReceiveMessage = useCallback((message) => {
    try {
      const {
        selectedChatData,
        selectedChatType,
        addMessage,
        addContactsInDMContacts,
      } = useAppStore.getState();

      if (
        selectedChatData &&
        selectedChatType === "contact" &&
        (selectedChatData._id === message.recipient._id ||
          selectedChatData._id === message.sender._id)
      ) {
        addMessage(message);
      }
      addContactsInDMContacts(message);
    } catch (error) {
      console.error("Error handling received message:", error);
      toast.error("Error processing message");
    }
  }, []);

  const handleReceiveChannelMessage = useCallback((message) => {
    try {
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
    } catch (error) {
      console.error("Error handling channel message:", error);
      toast.error("Error processing channel message");
    }
  }, []);

  const handleError = useCallback((error) => {
    console.error("Socket error:", error);
    toast.error("Connection error. Please check your internet connection.");
  }, []);

  const handleDisconnect = useCallback((reason) => {
    console.log("Socket disconnected:", reason);
    if (reason === "io server disconnect") {
      socket.current.connect();
    } else if (reason === "transport close") {
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttempts.current),
          10000
        );
        setTimeout(() => {
          reconnectAttempts.current += 1;
          socket.current.connect();
        }, delay);
      } else {
        toast.error("Failed to reconnect. Please refresh the page.");
      }
    }
  }, []);

  useEffect(() => {
    if (userInfo) {
      socket.current = io(HOST, {
        withCredentials: true,
        query: { userId: userInfo.id },
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 10000,
        extraHeaders: {
          "x-auth-token": localStorage.getItem("auth_token"),
        },
      });

      socket.current.on("connect", () => {
        console.log("Connected to chat server");
      });

      socket.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        toast.error("Failed to connect to chat server. Please try again.");
      });

      socket.current.on("disconnect", (reason) => {
        console.log("Disconnected from chat server:", reason);
        if (reason === "io server disconnect") {
          toast.error(
            "Disconnected from chat server. Please refresh the page."
          );
        }
      });

      socket.current.on("error", (error) => {
        console.error("Socket error:", error);
        toast.error("An error occurred with the chat connection.");
      });

      socket.current.on("receiveMessage", handleReceiveMessage);
      socket.current.on("receive-channel-message", handleReceiveChannelMessage);

      return () => {
        socket.current.off("connect");
        socket.current.off("connect_error");
        socket.current.off("disconnect");
        socket.current.off("error");
        socket.current.off("receiveMessage");
        socket.current.off("receive-channel-message");
        socket.current.disconnect();
      };
    }
  }, [userInfo]);

  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  );
};
