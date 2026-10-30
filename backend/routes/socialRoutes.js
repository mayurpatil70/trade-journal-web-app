// backend/routes/socialRoutes.js
import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import { upload } from "../middlewares/upload.js";
import * as social from "../controllers/socialController.js";
import * as community from "../controllers/communityController.js";

const router = express.Router();
const writeLimit = rateLimit({ windowMs: 60_000, max: 30 });

router.use(requireAuth);

router.get("/me", social.getMyProfile);
router.put("/me", writeLimit, social.updateMyProfile);
router.get("/search", social.searchTraders);
router.get("/presence", social.getPresence);

router.get("/leaderboard", social.getLeaderboard);
router.get("/traders/:id", social.getTraderProfile);
router.get("/traders/:id/stats", social.getTraderStats);
router.get("/traders/:id/card", social.getTraderCard);
router.get("/traders/:id/followers", social.listFollows);
router.get("/traders/:id/following", social.listFollows);
router.get("/traders/:id/mutuals", social.listFollows);
router.post("/follow", writeLimit, social.follow);
router.post("/unfollow", writeLimit, social.unfollow);

router.get("/feed", social.getFeed);
router.post("/posts", writeLimit, upload.array("media", 4), social.createPost);
router.post("/uploads", writeLimit, upload.single("image"), social.uploadImage);
router.get("/posts/:id", social.getPost);
router.delete("/posts/:id", social.deletePost);
router.post("/posts/:id/:kind", writeLimit, social.toggleReaction);

router.get("/conversations", social.listConversations);
router.post("/conversations/direct", writeLimit, social.openDirectConversation);
router.get("/conversations/:id/messages", social.getMessages);

router.get("/servers", community.listMyServers);
router.get("/servers/discover", community.discoverServers);
router.post("/servers", writeLimit, community.createServer);
router.get("/servers/:id", community.getServer);
router.patch("/servers/:id", writeLimit, community.updateServer);
router.delete("/servers/:id", community.deleteServer);
router.post("/servers/:id/join", writeLimit, community.joinServer);
router.post("/servers/:id/leave", writeLimit, community.leaveServer);
router.get("/servers/:id/members", community.listMembers);
router.post("/servers/:id/channels", writeLimit, community.addChannel);
router.delete("/servers/:id/channels/:channelId", community.removeChannel);
router.post("/servers/:id/invite/reset", writeLimit, community.resetInvite);
router.get("/invites/:code", community.previewInvite);
router.post("/invites/:code/join", writeLimit, community.acceptInvite);

router.get("/deals", social.listDeals);
router.get("/admin/deals", requireAdmin, social.listAllDeals);
router.post("/admin/deals", requireAdmin, social.createDeal);
router.patch("/admin/deals/:id", requireAdmin, social.updateDeal);
router.delete("/admin/deals/:id", requireAdmin, social.deleteDeal);

export default router;
