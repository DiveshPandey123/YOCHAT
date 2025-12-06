// components/FileUploadModal.js
import { Button, CloseButton, Input, Modal } from "@chakra-ui/react";
import React, { useRef, useState } from "react";
import {
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Box,
  Text,
  Flex,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";

// NOTE: Presigned S3 flow removed; parent handler ko /message/send par
// FormData (text, file) POST karna hai.

const FileUploadModal = (props) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setmessage] = useState("");

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
    } else {
      if (fileInputRef.current) fileInputRef.current.value = null;
      setSelectedFile(null);
      alert("Please select a valid image file.");
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleSend = (e) => {
    // CHANGED: allow send if either caption or image is present
    if (!selectedFile && !message.trim()) {
      // optional small guard; parent also validates
      return;
    }
    props.handleSendMessage(e, message, selectedFile); // CHANGED
    props.onClose(); // CHANGED
    // reset local state after close
    setTimeout(() => {
      setmessage("");
      removeFile();
    }, 0);
  };

  return (
    <>
      <Modal isOpen={props.isOpen} onClose={props.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send a photo</ModalHeader>
          <ModalBody>
            <Box mb={3}>
              <Button onClick={handleFileUpload}>Choose a photo</Button>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                ref={fileInputRef}
                display="none"
                id="chat-image-input" // CHANGED: add id for a11y
                name="chat-image"     // CHANGED: add name for a11y
              />
            </Box>

            {selectedFile && (
              <Flex
                align="center"
                justify="space-between"
                border="1px solid #eee"
                borderRadius="8px"
                p={2}
              >
                <Text fontSize="sm">
                  {selectedFile.name.length > 20
                    ? selectedFile.name.substring(0, 20) + "..."
                    : selectedFile.name}
                </Text>
                <CloseButton onClick={removeFile} />
              </Flex>
            )}

            <Flex mt={3} gap={2} align="center">
              <Input
                placeholder="Add a caption..."
                id="caption"         // CHANGED: add id
                name="caption"       // CHANGED: add name
                value={message}
                onChange={(e) => setmessage(e.target.value)}
              />
              <Button
                rightIcon={<ArrowForwardIcon />}
                colorScheme="blue"
                onClick={handleSend} // CHANGED
                isDisabled={!selectedFile && !message.trim()} // CHANGED: enable if either present
                size="md"
              >
                send
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default FileUploadModal;
// NOTE: Presigned S3 flow removed; parent handler ko /message/send par
// FormData (text, file) POST karna hai.
