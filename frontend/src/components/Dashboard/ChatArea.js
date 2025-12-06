// components/Dashboard/ChatArea.js
import React, { useState, useEffect, useContext } from "react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import Lottie from "react-lottie";
import animationdata from "../../typingAnimation.json";
import {
  Box,
  InputGroup,
  Input,
  Text,
  InputRightElement,
  Button,
  FormControl,
  InputLeftElement,
  useToast,
  useDisclosure,
} from "@chakra-ui/react";
import { FaFileUpload } from "react-icons/fa";
import { marked } from "marked";

import chatContext from "../../context/chatContext";
import ChatAreaTop from "./ChatAreaTop";
import FileUploadModal from "../miscellaneous/FileUploadModal";
import ChatLoadingSpinner from "../miscellaneous/ChatLoadingSpinner";
// REMOVED AWS: axios not needed for S3 POST anymore
// import axios from "axios"; // REMOVED AWS
import SingleMessage from "./SingleMessage";

// NOTE: Presigned S3 flow removed; backend /message/send accepts FormData and uploads to Cloudinary. // CHANGED

const scrollbarconfig = {
  "&::-webkit-scrollbar": {
    width: "5px",
    height: "5px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "gray.300",
    borderRadius: "5px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "gray.400",
  },
  "&::-webkit-scrollbar-track": {
    display: "none",
  },
};

const markdownToHtml = (markdownText) => {
  const html = marked(markdownText || "");
  return { __html: html };
};

const ChatArea = () => {
  const {
    hostName,
    user,
    receiver,
    socket,
    activeChatId,
    messageList,
    setMessageList,
    isOtherUserTyping,
    setIsOtherUserTyping,
    setActiveChatId,
    setReceiver,
    setMyChatList,
    myChatList,
    isChatLoading,
  } = useContext(chatContext);

  const [typing, settyping] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Lottie Options for typing
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationdata,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  useEffect(() => {
    return () => {
      window.addEventListener("popstate", () => {
        socket.emit("leave-chat", activeChatId);
        setActiveChatId("");
        setMessageList([]);
        setReceiver({});
      });
    };
  }, [socket, activeChatId, setActiveChatId, setMessageList, setReceiver]);

  useEffect(() => {
    socket.on("user-joined-room", (userId) => {
      const updatedList = messageList.map((message) => {
        if (message.senderId === user._id && userId !== user._id) {
          const index = message.seenBy.findIndex((seen) => seen.user === userId);
          if (index === -1) {
            message.seenBy.push({ user: userId, seenAt: new Date() });
          }
        }
        return message;
      });
      setMessageList(updatedList);
    });

    socket.on("typing", (data) => {
      if (data.typer !== user._id) {
        setIsOtherUserTyping(true);
      }
    });

    socket.on("stop-typing", (data) => {
      if (data.typer !== user._id) {
        setIsOtherUserTyping(false);
      }
    });

    socket.on("receive-message", (data) => {
      setMessageList((prev) => {
        // avoid duplicates by _id
        if (prev.some((m) => m._id === data._id)) return prev;
        return [...prev, data];
      });
      setTimeout(() => {
        document.getElementById("chat-box")?.scrollTo({
          top: document.getElementById("chat-box").scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    });

    socket.on("message-deleted", (data) => {
      const { messageId } = data;
      setMessageList((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    return () => {
      socket.off("typing");
      socket.off("stop-typing");
      socket.off("receive-message");
      socket.off("message-deleted");
    };
  }, [socket, messageList, setMessageList, user._id, setIsOtherUserTyping]);

  const handleTyping = () => {
    const messageInput = document.getElementById("new-message");
    if (!messageInput) return;

    if (messageInput.value === "" && typing) {
      settyping(false);
      socket.emit("stop-typing", {
        typer: user._id,
        conversationId: activeChatId,
      });
    } else if (messageInput.value !== "" && !typing) {
      settyping(true);
      socket.emit("typing", {
        typer: user._id,
        conversationId: activeChatId,
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage(e);
    }
  };

  // REMOVED AWS: getPreSignedUrl and S3 direct upload helpers deleted. // REMOVED AWS

  // CHANGED: API call to send message with optional file via FormData to backend
  const postMessageViaApi = async ({ conversationId, text, file }) => {
    const fd = new FormData();
    fd.append("conversationId", conversationId);
    fd.append("text", text);
    fd.append("senderId", user._id); // controller expects senderId now
    if (file) fd.append("file", file);

    const res = await fetch(`${hostName}/message/send`, {
      method: "POST",
      headers: {
        "auth-token": localStorage.getItem("token"),
        // Do not set Content-Type; browser sets boundary // CHANGED
      },
      body: fd,
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Failed to send");
    }
    return res.json();
  };

  // CHANGED: handleSendMessage now uses backend FormData route, no S3
  const handleSendMessage = async (e, messageText, file) => {
    e?.preventDefault?.();

    const text =
      messageText !== undefined
        ? messageText
        : document.getElementById("new-message")?.value || "";

    socket.emit("stop-typing", {
      typer: user._id,
      conversationId: activeChatId,
    });

    if (text === "" && !file) {
      toast({
        title: "Message cannot be empty",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Optimistic UI entry
      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        _id: tempId,
        conversationId: activeChatId,
        senderId: user._id,
        text,
        imageUrl: "", // normalized for UI // CHANGED
        createdAt: new Date().toISOString(),
        seenBy: [{ user: user._id, seenAt: new Date().toISOString() }],
      };
      setMessageList((prev) => [...prev, optimistic]);

      const saved = await postMessageViaApi({
        conversationId: activeChatId,
        text,
        file,
      });

      // Normalize field name if backend uses imageurl
      const normalized = { ...saved, imageUrl: saved.imageUrl || saved.imageurl || "" };

      // Replace optimistic with saved
      setMessageList((prev) => prev.map((m) => (m._id === tempId ? normalized : m)));

      // Do not emit "send-message" here; server socket handler would create a duplicate

      // Clear input
      const inputElem = document.getElementById("new-message");
      if (inputElem) inputElem.value = "";

      // Scroll down
      setTimeout(() => {
        document.getElementById("chat-box")?.scrollTo({
          top: document.getElementById("chat-box").scrollHeight,
          behavior: "smooth",
        });
      }, 100);

      // Update chat list ordering
      setMyChatList(
        await myChatList
          .map((chat) => {
            if (chat._id === activeChatId) {
              chat.latestmessage = text;
              chat.updatedAt = new Date().toUTCString();
            }
            return chat;
          })
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    } catch (error) {
      console.error(error);
      toast({
        title: error.message || "Failed to send",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const removeMessageFromList = (messageId) => {
    setMessageList((prev) => prev.filter((msg) => msg._id !== messageId));
  };

  return (
    <>
      {activeChatId !== "" ? (
        <>
          <Box
            justifyContent="space-between"
            h="100%"
            w={{ base: "100vw", md: "100%" }}
          >
            <ChatAreaTop />

            {isChatLoading && <ChatLoadingSpinner />}

            <Box
              id="chat-box"
              h="85%"
              overflowY="auto"
              sx={scrollbarconfig}
              mt={1}
              mx={1}
            >
              {messageList?.map((message) =>
                !message.deletedby?.includes(user._id) ? (
                  <SingleMessage
                    key={message._id}
                    message={message}
                    user={user}
                    receiver={receiver}
                    markdownToHtml={markdownToHtml}
                    scrollbarconfig={scrollbarconfig}
                    socket={socket}
                    activeChatId={activeChatId}
                    removeMessageFromList={removeMessageFromList}
                    toast={toast}
                  />
                ) : null
              )}
            </Box>

            <Box
              py={2}
              position="fixed"
              w={{ base: "100%", md: "70%" }}
              bottom={{ base: 1, md: 3 }}
              backgroundColor={
                localStorage.getItem("chakra-ui-color-mode") === "dark"
                  ? "#1a202c"
                  : "white"
              }
            >
              <Box mx={{ base: 6, md: 3 }} w="fit-content">
                {isOtherUserTyping && (
                  <Lottie
                    options={defaultOptions}
                    height={20}
                    width={20}
                    isStopped={false}
                    isPaused={false}
                  />
                )}
              </Box>
              <FormControl>
                <InputGroup
                  w={{ base: "95%", md: "98%" }}
                  m="auto"
                  onKeyDown={handleKeyPress}
                >
                  {!receiver?.email?.includes("bot") && (
                    <InputLeftElement>
                      <Button
                        mx={2}
                        size="sm"
                        onClick={onOpen}
                        borderRadius="lg"
                        aria-label="Upload"
                      >
                        <FaFileUpload />
                      </Button>
                    </InputLeftElement>
                  )}

                  <Input
                    placeholder="Type a message"
                    id="new-message"
                    name="new-message" 
                    autoComplete="off"
                    onChange={handleTyping}
                    borderRadius="10px"
                  />

                  <InputRightElement>
                    <Button
                      onClick={(e) =>
                        handleSendMessage(
                          e,
                          document.getElementById("new-message")?.value
                        )
                      }
                      size="sm"
                      mx={2}
                      borderRadius="10px"
                    >
                      <ArrowForwardIcon />
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </Box>
          </Box>
          <FileUploadModal
            isOpen={isOpen}
            onClose={onClose}
            handleSendMessage={handleSendMessage}
          />
        </>
      ) : (
        !isChatLoading && (
          <Box
            display={{ base: "none", md: "block" }}
            mx="auto"
            w="fit-content"
            mt="30vh"
            textAlign="center"
          >
            <Text fontSize="6vw" fontWeight="bold" fontFamily="Work sans">
              <Box as="span" color="orange.300">
                YO
              </Box>
              <Box as="span" color="blue.1000">
                /
              </Box>
              <Box as="span" color="blue.400">
                chat
              </Box>
            </Text>
            <Text fontSize="2vw">Online chatting app</Text>
            <Text fontSize="md">Select a chat to start messaging</Text>
          </Box>
        )
      )}
    </>
  );
};

export default ChatArea; // CHANGED: default export, so import ChatArea from "./ChatArea" in Dashboard
// CHANGED: default export, so import ChatArea from "./ChatArea" in Dashboard