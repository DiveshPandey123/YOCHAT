import React, { useMemo, useState, useContext, useRef } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
  Input,
  Image,
  Stack,
  HStack,
  Avatar,
  useToast,
  Checkbox,
  CheckboxGroup,
} from "@chakra-ui/react";
import chatContext from "../../context/chatContext";
import { FaUpload } from "react-icons/fa";

const GroupDetailsModal = ({ isOpen, onClose }) => {
  const { hostName, activeChatId, myChatList, setMyChatList, user } = useContext(chatContext);
  const toast = useToast();

  const convo = useMemo(() => myChatList.find((c) => c._id === activeChatId), [myChatList, activeChatId]);
  const isAdmin = useMemo(() => (convo?.admins || []).some((a) => a.toString?.() === user._id), [convo, user._id]);

  const [name, setName] = useState(convo?.name || "");
  const [description, setDescription] = useState(convo?.description || "");
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const fileInputRef = useRef(null);

  const candidates = useMemo(() => {
    const map = new Map();
    (myChatList || []).forEach((c) => {
      const m = c.members && c.members[0];
      if (m && m._id !== user._id) map.set(m._id, m);
    });
    return Array.from(map.values()).filter(
      (m) => !(convo?.members || []).some((cm) => (cm._id || cm) === m._id)
    );
  }, [myChatList, convo, user._id]);

  const refreshConvoInList = (updated) => {
    setMyChatList((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
  };

  const handleSaveBasics = async () => {
    try {
      const resp = await fetch(`${hostName}/conversation/${activeChatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "auth-token": localStorage.getItem("token") },
        body: JSON.stringify({ name, description }),
      });
      if (!resp.ok) throw new Error("Failed to update group");
      const updated = await resp.json();
      refreshConvoInList(updated);
      toast({ title: "Updated", status: "success", duration: 2000 });
    } catch (e) {
      toast({ title: e.message, status: "error" });
    }
  };

  const handleUploadAvatar = async (file) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch(`${hostName}/conversation/${activeChatId}/avatar`, {
        method: "POST",
        headers: { "auth-token": localStorage.getItem("token") },
        body: fd,
      });
      if (!resp.ok) throw new Error("Upload failed");
      const { groupAvatarUrl } = await resp.json();
      refreshConvoInList({ ...convo, groupAvatarUrl });
      toast({ title: "Avatar updated", status: "success", duration: 2000 });
    } catch (e) {
      toast({ title: e.message, status: "error" });
    }
  };

  const handleAddMembers = async () => {
    try {
      const resp = await fetch(`${hostName}/conversation/${activeChatId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "auth-token": localStorage.getItem("token") },
        body: JSON.stringify({ memberIds: selectedToAdd }),
      });
      if (!resp.ok) throw new Error("Failed to add members");
      const updated = await resp.json();
      refreshConvoInList(updated);
      setSelectedToAdd([]);
      toast({ title: "Members added", status: "success", duration: 2000 });
    } catch (e) {
      toast({ title: e.message, status: "error" });
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const resp = await fetch(`${hostName}/conversation/${activeChatId}/members/${memberId}`, {
        method: "DELETE",
        headers: { "auth-token": localStorage.getItem("token") },
      });
      if (!resp.ok) throw new Error("Failed to remove member");
      const updated = await resp.json();
      refreshConvoInList(updated);
      toast({ title: "Member removed", status: "success", duration: 2000 });
    } catch (e) {
      toast({ title: e.message, status: "error" });
    }
  };

  const handleLeave = async () => {
    try {
      const resp = await fetch(`${hostName}/conversation/${activeChatId}/leave`, {
        method: "POST",
        headers: { "auth-token": localStorage.getItem("token") },
      });
      if (!resp.ok) throw new Error("Failed to leave group");
      onClose();
      toast({ title: "Left group", status: "success" });
    } catch (e) {
      toast({ title: e.message, status: "error" });
    }
  };

  if (!convo) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Group Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <HStack spacing={4}>
              <Avatar
                size="xl"
                src={convo.groupAvatarUrl}
                name={convo.name}
                cursor={isAdmin ? "pointer" : "default"}
                onClick={() => isAdmin && fileInputRef.current?.click()}
              />
              {isAdmin && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => e.target.files?.[0] && handleUploadAvatar(e.target.files[0])}
                  />
                  <Button
                    leftIcon={<FaUpload />}
                    colorScheme="purple"
                    variant="solid"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change avatar
                  </Button>
                </>
              )}
            </HStack>

            <Stack>
              <Text fontWeight="bold">Name</Text>
              <Input value={name} onChange={(e) => setName(e.target.value)} isDisabled={!isAdmin} />
            </Stack>

            <Stack>
              <Text fontWeight="bold">About</Text>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} isDisabled={!isAdmin} />
            </Stack>

            <Stack>
              <Text fontWeight="bold">Members</Text>
              <Stack>
                {(convo.members || []).map((m) => (
                  <HStack key={(m._id || m)} justify="space-between">
                    <HStack>
                      <Avatar size="sm" src={m.profilePic} name={m.name} />
                      <Text>{m.name || m._id}</Text>
                    </HStack>
                    {isAdmin && (m._id || m) !== user._id && (
                      <Button size="xs" colorScheme="red" onClick={() => handleRemoveMember(m._id || m)}>
                        Remove
                      </Button>
                    )}
                  </HStack>
                ))}
              </Stack>
            </Stack>

            {isAdmin && (
              <Stack>
                <Text fontWeight="bold">Add members</Text>
                <CheckboxGroup value={selectedToAdd} onChange={setSelectedToAdd}>
                  <Stack maxH="25vh" overflowY="auto">
                    {candidates.map((u) => (
                      <Checkbox value={u._id} key={u._id}>{u.name}</Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
                <Button colorScheme="purple" size="sm" onClick={handleAddMembers} isDisabled={selectedToAdd.length === 0}>
                  Add Selected
                </Button>
              </Stack>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          {!isAdmin && (
            <Button colorScheme="red" mr={3} onClick={handleLeave}>Leave Group</Button>
          )}
          {isAdmin && (
            <Button colorScheme="purple" onClick={handleSaveBasics}>Save</Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GroupDetailsModal;


