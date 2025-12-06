// appState.js
import { useState, useEffect, useMemo, useRef } from "react";
import io from "socket.io-client";
import chatContext from "./chatContext";

// CHANGED: env-driven base URL with sensible fallback
const DEFAULT_LOCAL = "http://localhost:5000"; // CHANGED
const DEFAULT_PROD = "https://chat-app-u2cq.onrender.com"; // CHANGED
const hostName =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? DEFAULT_LOCAL : DEFAULT_PROD); // CHANGED

function createSocket(baseUrl) {
  return io(baseUrl, {
    autoConnect: false, // CHANGED
    transports: ["websocket", "polling"], // CHANGED
    withCredentials: true, // CHANGED
  });
}

const ChatState = (props) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [receiver, setReceiver] = useState({});
  const [messageList, setMessageList] = useState([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [myChatList, setMyChatList] = useState([]);
  const [originalChatList, setOriginalChatList] = useState([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef(createSocket(hostName)); // CHANGED

  // CHANGED: common GET wrapper with credentials and token header
  const apiGet = async (path) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${hostName}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "auth-token": token } : {}), // CHANGED
      },
      credentials: "include", // CHANGED
    });
    return res;
  };

  // CHANGED: robust fetchData with guards
  const fetchData = async () => {
    try {
      const res = await apiGet("/conversation/");
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to fetch conversations: ${res.status} ${text}`); // CHANGED
      }
      const data = await res.json();
      setMyChatList(data);
      setOriginalChatList(data);
    } catch (err) {
      console.error("conversation fetch error:", err); // CHANGED
    } finally {
      setIsLoading(false);
    }
  };

  // Online/offline socket events (keep)
  useEffect(() => {
    const socket = socketRef.current;
    const online = () => setReceiver((prev) => ({ ...prev, isOnline: true }));
    const offline = () =>
      setReceiver((prev) => ({
        ...prev,
        isOnline: false,
        lastSeen: new Date().toISOString(),
      }));
    socket.on("receiver-online", online);
    socket.on("receiver-offline", offline);
    return () => {
      socket.off("receiver-online", online);
      socket.off("receiver-offline", offline);
    };
  }, []);

  // CHANGED: bootstrap user + conversations
  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        setUser({});
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiGet("/auth/me");
        if (!res.ok) throw new Error(`auth/me ${res.status}`); // CHANGED
        const data = await res.json();
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
        setIsAuthenticated(true);

        const socket = socketRef.current;
        if (!socket.connected) socket.connect(); // CHANGED
        socket.emit("setup", data._id);
      } catch (err) {
        console.error("auth fetch error:", err); // CHANGED
        setIsAuthenticated(false);
        setUser({});
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        fetchData(); // CHANGED
      }
    };
    bootstrap();
  }, []);

  // CHANGED: provide both fetchData and alias for compatibility
  const value = useMemo(
    () => ({
      isAuthenticated,
      setIsAuthenticated,
      user,
      setUser,
      receiver,
      setReceiver,
      messageList,
      setMessageList,
      activeChatId,
      setActiveChatId,
      myChatList,
      setMyChatList,
      originalChatList,
      setOriginalChatList,
      isOtherUserTyping,
      setIsOtherUserTyping,
      isChatLoading,
      setIsChatLoading,
      isLoading,
      setIsLoading,
      hostName,
      socket: socketRef.current,
      fetchData, // CHANGED: added for Login.js compatibility
      refetchConversations: fetchData, // CHANGED: alias
    }),
    [
      isAuthenticated,
      user,
      receiver,
      messageList,
      activeChatId,
      myChatList,
      originalChatList,
      isOtherUserTyping,
      isChatLoading,
      isLoading,
    ]
  );

  // CHANGED: actual Provider wrapper
  return (
    <chatContext.Provider value={value}>{props.children}</chatContext.Provider> // CHANGED
  );
};

export default ChatState;
