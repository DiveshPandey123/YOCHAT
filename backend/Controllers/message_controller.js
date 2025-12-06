// Controllers/message_controller.js

const Message = require("../Models/Message.js");
const Conversation = require("../Models/Conversation.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const imageupload = require("../config/imageupload.js");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

// REMOVED AWS: secret imports not needed
// const { AWS_BUCKET_NAME, AWS_SECRET, AWS_ACCESS_KEY } = require("../secrets.js"); // REMOVED AWS

// REMOVED AWS: S3 and presigned post
// const { S3Client } = require("@aws-sdk/client-s3"); // REMOVED AWS
// const { createPresignedPost } = require("@aws-sdk/s3-presigned-post"); // REMOVED AWS

const configuration = new GoogleGenerativeAI(process.env.GENERATIVE_API_KEY);
const modelId = "gemini-1.5-flash";
const model = configuration.getGenerativeModel({ model: modelId });

const sendMessage = async (req, res) => {
  // CHANGED: always use Cloudinary for upload, no S3
  let imageUrl = "";
  if (req.file) {
    imageUrl = await imageupload(req.file, false); // secure_url or ""
  }

  try {
    const { conversationId, senderId, text } = req.body;
    if (!conversationId || !senderId || (!text && !imageUrl)) {
      return res.status(400).json({ error: "Text or image is required" });
    }

    const conversation = await Conversation.findById(conversationId).populate(
      "members",
      "-password"
    );

    // check if conversation contains bot
    let isbot = false;
    conversation.members.forEach((member) => {
      if (member._id != senderId && member.email.includes("bot")) {
        isbot = true;
      }
    });

    if (!isbot) {
      const newMessageData = {
        conversationId,
        senderId,
        seenBy: [{ user: senderId }],
      };
      if (text) newMessageData.text = text;
      if (imageUrl) newMessageData.imageUrl = imageUrl;
      const newMessage = new Message(newMessageData);

      await newMessage.save();
      conversation.updatedAt = new Date();
      await conversation.save();
      return res.json(newMessage);
    } else {
      // Optional: Bot flow intact as per your file
      // If bot logic should run, keep your existing getAiResponse usage here
      const botMessage = await getAiResponse(text, senderId, conversationId);
      return res.json(botMessage);
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Internal Server Error");
  }
};

const allMessage = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.id,
      deletedFrom: { $ne: req.user.id },
    });

    // seenBy update for current user
    for (const message of messages) {
      let isUserAddedToSeenBy = false;
      message.seenBy.forEach((element) => {
        if (element.user == req.user.id) {
          isUserAddedToSeenBy = true;
        }
      });
      if (!isUserAddedToSeenBy) {
        message.seenBy.push({ user: req.user.id });
        await message.save();
      }
    }

    return res.json(messages);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Internal Server Error");
  }
};

const deletemesage = async (req, res) => {
  const msgid = req.body.messageid;
  const userids = req.body.userids;
  try {
    const message = await Message.findById(msgid);
    userids.forEach(async (userid) => {
      if (!message.deletedFrom.includes(userid)) {
        message.deletedFrom.push(userid);
      }
    });
    await message.save();
    return res.status(200).send("Message deleted successfully");
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

// REMOVED AWS: getPresignedUrl fully deleted
// const getPresignedUrl = async (req, res) => { ... } // REMOVED AWS

const getAiResponse = async (prompt, senderId, conversationId) => {
  let currentMessages = [];
  const conv = await Conversation.findById(conversationId);
  const botId = conv.members.find((member) => member != senderId);
  const messagelist = await Message.find({
    conversationId: conversationId,
  })
    .sort({ createdAt: -1 })
    .limit(20);

  messagelist.forEach((message) => {
    if (message.senderId == senderId) {
      currentMessages.push({
        role: "user",
        parts: message.text,
      });
    } else {
      currentMessages.push({
        role: "model",
        parts: message.text,
      });
    }
  });

  currentMessages = currentMessages.reverse();

  try {
    const chat = model.startChat({
      history: currentMessages,
      generationConfig: {
        maxOutputTokens: 2000,
      },
    });
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    let responseText = response.text();
    if (responseText.length < 1) {
      responseText = "Woops!! thats soo long ask me something in short.";
      return -1;
    }

    await Message.create({
      conversationId: conversationId,
      senderId: senderId,
      text: prompt,
      seenBy: [{ user: botId, seenAt: new Date() }],
    });

    const botMessage = await Message.create({
      conversationId: conversationId,
      senderId: botId,
      text: responseText,
    });

    conv.latestmessage = responseText;
    await conv.save();
    return botMessage;
  } catch (error) {
    console.log(error.message);
    return "some error occured while generating response";
  }
};

const sendMessageHandler = async (data) => {
  const {
    text,
    imageUrl,
    senderId,
    conversationId,
    receiverId,
    isReceiverInsideChatRoom,
  } = data;

  const conversation = await Conversation.findById(conversationId);

  if (!isReceiverInsideChatRoom) {
    const message = await Message.create({
      conversationId,
      senderId,
      text,
      imageUrl,
      seenBy: [],
    });

    // update conversation latest message and increment unread count of receiver by 1
    conversation.latestmessage = text;
    conversation.unreadCounts.map((unread) => {
      if (unread.userId.toString() == receiverId.toString()) {
        unread.count += 1;
      }
    });
    await conversation.save();
    return message;
  } else {
    // create new message with seenby receiver
    const message = await Message.create({
      conversationId,
      senderId,
      text,
      seenBy: [
        {
          user: receiverId,
          seenAt: new Date(),
        },
      ],
    });

    conversation.latestmessage = text;
    await conversation.save();
    return message;
  }
};

const deleteMessageHandler = async (data) => {
  const { messageId, deleteFrom } = data;
  const message = await Message.findById(messageId);
  if (!message) return false;

  try {
    deleteFrom.forEach(async (userId) => {
      if (!message.deletedFrom.includes(userId)) {
        message.deletedFrom.push(userId);
      }
    });
    await message.save();
    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

module.exports = {
  sendMessage,
  allMessage,
  // getPresignedUrl, // REMOVED AWS
  getAiResponse,
  deletemesage,
  sendMessageHandler,
  deleteMessageHandler,
};
// REMOVED AWS: getPresignedUrl function and related imports removed