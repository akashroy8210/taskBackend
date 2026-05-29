import { Server } from "socket.io";
import express from "express"
import http, { createServer } from "http"
import connectionDB from "./config/db.js";
import dotenv from "dotenv"
import cors from "cors"
import RoomRoutes from "./routes/RoomRoutes.js"
import socketHandler from "./socket.js"
const app = express()
dotenv.config()
app.use(cors())

app.use('/', RoomRoutes)
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

connectionDB()

socketHandler(io)

const PORT = 8081
server.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`)
})
