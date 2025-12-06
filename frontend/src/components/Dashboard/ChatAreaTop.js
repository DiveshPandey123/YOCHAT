import {
  Box,
  Flex,
  Text,
  Button,
  Image,
  Tooltip,
  SkeletonCircle,
  Skeleton,
  Circle,
  Stack,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "@chakra-ui/react";
import { ArrowBackIcon, DeleteIcon } from "@chakra-ui/icons";
import React, { useContext, useEffect, useMemo } from "react";
import chatContext from "../../context/chatContext";
import { ProfileModal } from "../miscellaneous/ProfileModal";
import GroupDetailsModal from "../miscellaneous/GroupDetailsModal";

const ChatAreaTop = () => {
  const context = useContext(chatContext);

  const {
    receiver,
    setReceiver,
    activeChatId,
    setActiveChatId,
    setMessageList,
    isChatLoading,
    hostName,
    socket,
    myChatList,
    setMyChatList,
  } = context;

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const toast = useToast();

  const currentConversation = useMemo(
    () => (context.myChatList || []).find((c) => c._id === activeChatId),
    [context.myChatList, activeChatId]
  );

  const getReceiverOnlineStatus = async () => {
    if (!receiver._id) {
      return;
    }

    try {
      const repsonse = await fetch(
        `${hostName}/user/online-status/${receiver._id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("token"),
          },
        }
      );
      const data = await repsonse.json();
      setReceiver((receiver) => ({
        ...receiver,
        isOnline: data.isOnline,
      }));
    } catch (error) {}
  };

  const handleBack = () => {
    socket.emit("leave-chat", activeChatId);
    setActiveChatId("");
    setMessageList([]);
    setReceiver({});
  };

  const handleDeleteGroup = async () => {
    try {
      const response = await fetch(`${hostName}/conversation/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({ conversationId: activeChatId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete group");
      }

      // Remove from chat list
      const updatedChatList = myChatList.filter(chat => chat._id !== activeChatId);
      setMyChatList(updatedChatList);

      // Close the chat
      handleBack();

      toast({
        title: "Group deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onDeleteClose();
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to delete group",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getLastSeenString = (lastSeen) => {
    var lastSeenString = "last seen ";
    if (new Date(lastSeen).toDateString() === new Date().toDateString()) {
      lastSeenString += "today ";
    } else if (
      new Date(lastSeen).toDateString() ===
      new Date(new Date().setDate(new Date().getDate() - 1)).toDateString()
    ) {
      lastSeenString += "yesterday ";
    } else {
      lastSeenString += `on ${new Date(lastSeen).toLocaleDateString()} `;
    }

    lastSeenString += `at ${new Date(lastSeen).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    return lastSeenString;
  };

  useEffect(() => {
    getReceiverOnlineStatus();
  }, [receiver?._id]);
  return (
    <>
      <Flex w={"100%"}>
        <Button
          borderRadius={0}
          height={"inherit"}
          onClick={() => handleBack()}
        >
          <ArrowBackIcon />
        </Button>
        <Tooltip label="View Profile">
          <Button
            w={"100%"}
            mr={0}
            p={2}
            h={"max-content"}
            justifyContent={"space-between"}
            borderRadius={"0px"}
            onClick={onOpen}
          >
            {isChatLoading ? (
              <>
                <Flex>
                  <SkeletonCircle size="10" mx={2} />
                  <Skeleton
                    height="20px"
                    width="250px"
                    borderRadius={"md"}
                    my={2}
                  />
                </Flex>
              </>
            ) : (
              <>
                <Flex gap={2} alignItems={"center"}>
                  <Image
                    borderRadius="full"
                    boxSize="40px"
                    src={
                      receiver._id === "group"
                        ? currentConversation?.groupAvatarUrl || "https://via.placeholder.com/80/6B46C1/FFFFFF?text=G"
                        : receiver.profilePic
                    }
                    alt=""
                  />

                  <Stack
                    justifyContent={"center"}
                    m={0}
                    p={0}
                    lineHeight={1}
                    gap={0}
                    textAlign={"left"}
                  >
                    <Text mx={1} my={receiver.isOnline ? 0 : 2} fontSize="2xl">
                      {receiver._id === "group" ? currentConversation?.name : receiver.name}
                    </Text>
                    {receiver._id === "group" ? null : (
                      receiver.isOnline ? (
                        <Text mx={1} fontSize={"small"}>
                          <Circle
                            size="2"
                            bg="green.500"
                            display="inline-block"
                            borderRadius="full"
                            mx={1}
                          />
                          active now
                        </Text>
                      ) : (
                        <Text my={0} mx={1} fontSize={"xx-small"}>
                          {getLastSeenString(receiver.lastSeen)}
                        </Text>
                      )
                    )}
                  </Stack>
                </Flex>
              </>
            )}
          </Button>
        </Tooltip>
        
        {/* Delete Group Button - only show for groups */}
        {receiver._id === "group" && (
          <Tooltip label="Delete Group">
            <Button
              colorScheme="red"
              variant="ghost"
              size="sm"
              onClick={onDeleteOpen}
              mr={2}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        )}
      </Flex>

      {receiver._id === "group" ? (
        <GroupDetailsModal isOpen={isOpen} onClose={onClose} />
      ) : (
        <ProfileModal isOpen={isOpen} onClose={onClose} user={receiver} />
      )}
      
      {/* Delete Group Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to delete this group? This action cannot be undone.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeleteGroup}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ChatAreaTop;
