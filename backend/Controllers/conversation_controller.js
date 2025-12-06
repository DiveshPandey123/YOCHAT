const Conversation = require("../Models/Conversation.js");

const createConversation = async (req, res) => {
  try {
    const { members: memberIds, isGroup, name } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length < 2) {
      return res.status(400).json({ error: "At least two members are required" });
    }

    if (isGroup) {
      // For groups, name is required by schema
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: "Group name is required" });
      }

      const newConversation = await Conversation.create({
        members: memberIds,
        isGroup: true,
        name: name.trim(),
        admins: [req.user.id],
        unreadCounts: memberIds.map((memberId) => ({ userId: memberId, count: 0 })),
      });

      await newConversation.populate("members", "-password");
      newConversation.members = newConversation.members.filter(
        (member) => member.id !== req.user.id
      );
      return res.status(200).json(newConversation);
    }

    // 1-1 conversation: reuse existing if present
    const conv = await Conversation.findOne({
      members: { $all: memberIds },
      isGroup: false,
    }).populate("members", "-password");

    if (conv) {
      conv.members = conv.members.filter((memberId) => memberId !== req.user.id);
      return res.status(200).json(conv);
    }

    const newConversation = await Conversation.create({
      members: memberIds,
      unreadCounts: memberIds.map((memberId) => ({ userId: memberId, count: 0 })),
    });

    await newConversation.populate("members", "-password");
    newConversation.members = newConversation.members.filter(
      (member) => member.id !== req.user.id
    );

    return res.status(200).json(newConversation);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id).populate(
      "members",
      "-password",
      "-phoneNum"
    );

    if (!conversation) {
      return res.status(404).json({
        error: "No conversation found",
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

const getConversationList = async (req, res) => {
  const userId = req.user.id;

  try {
    const conversationList = await Conversation.find({
      members: { $in: userId },
    }).populate("members", "-password");

    if (!conversationList) {
      return res.status(404).json({
        error: "No conversation found",
      });
    }

    // remove user from members and also other chatbots
    for (let i = 0; i < conversationList.length; i++) {
      conversationList[i].members = conversationList[i].members.filter(
        (member) => member.id !== userId
      );
    }

    conversationList.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    res.status(200).json(conversationList);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user.id;

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Check if user is a member of the conversation
    if (!conversation.members.includes(userId)) {
      return res.status(403).json({ error: "You are not a member of this conversation" });
    }

    // For groups, only allow deletion if user is the creator or admin
    // For now, allow any member to delete (you can add admin logic later)
    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

// Admin-only updates: name, description, groupAvatarUrl
const updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, groupAvatarUrl } = req.body;

    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    if (!conversation.isGroup) return res.status(400).json({ error: "Not a group" });
    if (!conversation.admins?.includes(userId)) return res.status(403).json({ error: "Only admins can update" });

    if (name !== undefined) conversation.name = name;
    if (description !== undefined) conversation.description = description;
    if (groupAvatarUrl !== undefined) conversation.groupAvatarUrl = groupAvatarUrl;

    await conversation.save();
    await conversation.populate("members", "-password");
    res.json(conversation);
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
};

// Add members (admin only)
const addMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { memberIds } = req.body; // array

    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    if (!conversation.admins?.includes(userId)) return res.status(403).json({ error: "Only admins can add" });

    const toAdd = (memberIds || []).filter((m) => !conversation.members.map(String).includes(String(m)));
    conversation.members.push(...toAdd);
    // initialize unreadCounts for added members
    toAdd.forEach((m) => conversation.unreadCounts.push({ userId: m, count: 0 }));
    await conversation.save();
    await conversation.populate("members", "-password");
    res.json(conversation);
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
};

// Remove member (admin only)
const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user.id;
    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    if (!conversation.admins?.includes(userId)) return res.status(403).json({ error: "Only admins can remove" });

    conversation.members = conversation.members.filter((m) => String(m) !== String(memberId));
    conversation.unreadCounts = conversation.unreadCounts.filter((u) => String(u.userId) !== String(memberId));
    await conversation.save();
    await conversation.populate("members", "-password");
    res.json(conversation);
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
};

// Leave group (any member)
const leaveConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    conversation.members = conversation.members.filter((m) => String(m) !== String(userId));
    conversation.unreadCounts = conversation.unreadCounts.filter((u) => String(u.userId) !== String(userId));

    // if last admin left, promote first member as admin
    if (conversation.admins?.map(String).includes(String(userId))) {
      conversation.admins = conversation.admins.filter((a) => String(a) !== String(userId));
      if (conversation.admins.length === 0 && conversation.members.length > 0) {
        conversation.admins = [conversation.members[0]];
      }
    }

    await conversation.save();
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
};

// Upload group avatar (admin only), uses Cloudinary via existing imageupload helper
const imageupload = require("../config/imageupload.js");
const uploadGroupAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    if (!conversation.isGroup) return res.status(400).json({ error: "Not a group" });
    if (!conversation.admins?.includes(userId)) return res.status(403).json({ error: "Only admins can update avatar" });

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = await imageupload(req.file, false);
    conversation.groupAvatarUrl = url || "";
    await conversation.save();
    res.json({ groupAvatarUrl: conversation.groupAvatarUrl });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  createConversation,
  getConversation,
  getConversationList,
  deleteConversation,
  updateConversation,
  addMembers,
  removeMember,
  leaveConversation,
  uploadGroupAvatar,
};
