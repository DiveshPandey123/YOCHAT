import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import {
  Box,
  Divider,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  Button,
} from "@chakra-ui/react";
import {
  AddIcon,
  ArrowBackIcon,
  ChevronRightIcon,
  Search2Icon,
} from "@chakra-ui/icons";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, useDisclosure, CheckboxGroup, Checkbox, Stack as CStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { useContext } from "react";
import chatContext from "../../context/chatContext";

const NewChats = (props) => {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState(data);
  const context = useContext(chatContext);
  const {
    hostName,
    socket,
    user,
    myChatList,
    setMyChatList,
    setReceiver,
    setActiveChatId,
  } = context;

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Contacts from existing chats (friends)
  const contacts = useMemo(() => {
    try {
      return (myChatList || [])
        .map((c) => c.members && c.members[0])
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  }, [myChatList]);

  // Candidates = contacts ∪ non-friends (unique)
  const groupCandidates = useMemo(() => {
    const map = new Map();
    [...contacts, ...users].forEach((u) => {
      if (u && u._id && u._id !== user._id) map.set(u._id, u);
    });
    return Array.from(map.values());
  }, [contacts, users, user._id]);

  const fetchNonFriendsList = async () => {
    try {
      const response = await fetch(`${hostName}/user/non-friends`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const jsonData = await response.json();
      setData(jsonData);
      setUsers(jsonData);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    async function fetchList() {
      await fetchNonFriendsList();
    }
    fetchList();
  }, [myChatList]);

  const handleUserSearch = async (e) => {
    if (e.target.value !== "") {
      const newusers = data.filter((user) =>
        user.name.toLowerCase().includes(e.target.value.toLowerCase())
      );
      setUsers(newusers);
    } else {
      setUsers(data);
    }
  };

  const handleNewChat = async (e, receiverid) => {
    e.preventDefault();
    const payload = { members: [user._id, receiverid] };
    try {
      const response = await fetch(`${hostName}/conversation/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();

      setMyChatList([data, ...myChatList]);
      setReceiver(data.members[0]);
      setActiveChatId(data._id);
      props.setactiveTab(0);

      socket.emit("join-chat", {
        roomId: data._id,
        userId: user._id,
      });

      setUsers((users) => users.filter((user) => user._id !== receiverid));
    } catch (error) {
      console.log(error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    const members = Array.from(new Set([user._id, ...selectedMembers]));
    try {
      const response = await fetch(`${hostName}/conversation/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({ members, isGroup: true, name: groupName.trim() }),
      });
      if (!response.ok) throw new Error("Failed to create group");
      const data = await response.json();
      setMyChatList([data, ...myChatList]);
      setReceiver({ _id: "group", name: data.name, profilePic: "" });
      setActiveChatId(data._id);
      onClose();
      setGroupName("");
      setSelectedMembers([]);
      socket.emit("join-chat", { roomId: data._id, userId: user._id });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <Box>
        <Flex justify={"space-between"}>
          <Button onClick={() => props.setactiveTab(0)}>
            <ArrowBackIcon />
          </Button>

          <Box display={"flex"}>
            <InputGroup w={"fit-content"} mx={2}>
              <InputLeftElement pointerEvents="none">
                <Search2Icon color="gray.300" />
              </InputLeftElement>
              <Input
                type="text"
                placeholder="Enter Name"
                onChange={handleUserSearch}
                id="search-input"
              />
            </InputGroup>
          </Box>
        </Flex>
      </Box>

      <Divider my={2} />

      <Box
        h={{ base: "63vh", md: "72vh" }}
        overflowY={"scroll"}
        sx={{
          "::-webkit-scrollbar": {
            width: "4px",
          },
          "::-webkit-scrollbar-track": {
            width: "6px",
          },
          "::-webkit-scrollbar-thumb": {
            background: { base: "gray.300", md: "gray.500" },
            borderRadius: "24px",
          },
        }}
      >
        <Button my={2} mx={2} colorScheme="purple" onClick={onOpen}>
          Create New Group <AddIcon ml={2} fontSize={"12px"} />
        </Button>
        {users.map(
          (user) =>
            user._id !== context.user._id && (
              <Flex key={user._id} p={2}>
                <Button
                  h={"4em"}
                  w={"100%"}
                  justifyContent={"space-between"}
                  onClick={(e) => handleNewChat(e, user._id)}
                >
                  <Flex>
                    <Box>
                      <img
                        src={user.profilePic}
                        alt="profile"
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                        }}
                      />
                    </Box>
                    <Box mx={3} textAlign={"start"}>
                      <Text fontSize={"lg"} fontWeight={"bold"}>
                        {user.name}
                      </Text>
                      <Text fontSize={"sm"} color={"gray.500"}>
                        {user.phoneNum}
                      </Text>
                    </Box>
                  </Flex>

                  <ChevronRightIcon />
                </Button>
              </Flex>
            )
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Group name"
              mb={3}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <Text mb={2} fontWeight="bold">Select members</Text>
            <CheckboxGroup value={selectedMembers} onChange={setSelectedMembers}>
              <CStack maxH="40vh" overflowY="auto" spacing={2}>
                {groupCandidates.map((u) => (
                    <Checkbox key={u._id} value={u._id}>
                      {u.name}
                    </Checkbox>
                  ))}
              </CStack>
            </CheckboxGroup>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} mr={3}>Cancel</Button>
            <Button colorScheme="purple" onClick={handleCreateGroup}>Create</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default NewChats;
