import { useAppStore } from "@/store";
import { HOST } from "@/utils/constants";
import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const socket = useRef();
    const { userInfo } = useAppStore();

    const handleReceiveMessage = useCallback((message) => {
        const { selectedChatData, selectedChatType, addMessage } = useAppStore.getState();
        
        console.log('Received message:', message);

        if (selectedChatData && selectedChatType === "contact" && 
            (selectedChatData._id === message.recipient._id || 
             selectedChatData._id === message.sender._id)) {
            addMessage(message);
        }
    }, []);

    useEffect(() => {
        if (!userInfo?.id) return;

        socket.current = io(HOST, {
            withCredentials: true,
            query: { userId: userInfo.id },
        });

        socket.current.on("connect", () => {
            console.log("Connected to socket server with ID:", socket.current.id);
        });

        socket.current.on("receiveMessage", handleReceiveMessage);

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