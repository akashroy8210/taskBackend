import express from "express";
import createRoomController from "../controllers/RoomController.js"
const router=express.Router()

router.post('/create-room',createRoomController)

export default router