import Room from "./models/RoomModel.js"
import activeRooms from "./store/activeRoom.js"
const socketHandler = (io) => {
    const generateRoomPin = () => {
        return Math.floor(100000 + Math.random() * 9000).toString()
    }
    io.on("connection", async (socket) => {
        console.log("User connected", socket.id)

        socket.on("create-room", async (data, callback) => {
            try {
                //taking username from participant 
                const { username } = data;
                // if not username is provided giving error
                if (!username) {
                    return callback({
                        success: false,
                        message:
                            "Username is required"
                    });
                }
                let roomPin;
                //while roomPin is not unique
                do {
                    roomPin =
                        generateRoomPin();
                } while (
                    activeRooms[roomPin]);

                //creating host participant data
                const hostParticipant = {
                    socketId:
                        socket.id,
                    username,
                    role: "HOST",
                    score: 0,
                    rank: 0,
                    selectedAnswer: "",
                    hasAnswered: false,
                };

                //creating room
                const room = await Room.create({
                    roomPin
                });

                //joining room
                socket.join(roomPin);
                //creating room in local storage
                activeRooms[roomPin] = {
                    roomPin,
                    hostId:
                        socket.id,
                    participants: [
                        hostParticipant
                    ],
                    gameState:
                        "WAITING",
                    currentSlideIndex: -1,
                    slides:
                        room.slides,
                    leaderboard: [],
                    answers: {},
                    currentTimer: 0,
                    timer: null,
                };
                //seding message of joining participant
                io.to(roomPin).emit(
                    "participants-updated",
                    activeRooms[
                        roomPin
                    ].participants
                );

                callback({
                    success: true,
                    message:
                        "Room created successfully",

                    roomPin,
                });

                console.log(
                    `Room Created: ${roomPin} `
                );

            } catch (err) {

                console.log(err);

                callback({

                    success: false,

                    message:
                        "Failed to create room"
                });
            }
        }
        );


        // join the room
        socket.on('join-room', async (data, callback) => {
            //taking roomPin and username from participant
            const { roomPin, username } = data
            const room = await Room.findOne({ roomPin })
            if (!room) {
                return callback({
                    success: false,
                    message: "Room not found"
                })
            }

            if (!activeRooms[roomPin]) {
                activeRooms[roomPin] = {
                    participants: room.participants || [],
                    gameState: room.gameState,
                    currentSlideIndex:
                        room.currentSlideIndex,
                    slides:
                        room.slides || [],
                    leaderboard:
                        room.leaderboard || [],
                    questions: [],
                    answers: {},
                    currentTimer: null,
                    timer: null
                }
            }
            const existingUser =
                activeRooms[roomPin].participants.find(
                    (user) => user.username === username
                )
            if (existingUser) {
                existingUser.socketId = socket.id
                socket.join(roomPin)
                socket.roomPin = roomPin
                socket.username = username
                io.to(roomPin).emit(
                    "participants-updated",
                    activeRooms[roomPin].participants
                )
                return callback({
                    success: true,
                    roomData: activeRooms[roomPin]
                })
            }

            socket.join(roomPin)
            const participant = {
                socketId: socket.id,
                username,
                score: 0,
                rank: 0
            }
            activeRooms[roomPin]
                .participants
                .push(participant)

            const dbuser = room.participants.find(user => user.username === username)
            if (!dbuser) {
                room.participants.push(participant)
                await room.save()
            }


            socket.roomPin = roomPin
            socket.username = username

            //sending user list
            io.to(roomPin).emit("participants-updated", activeRooms[roomPin].participants)

            //join message

            socket.to(roomPin).emit("system-message", `${username} joined the room  `)

            callback({
                success: true,
                roomData: activeRooms[roomPin]
            })
        })

        socket.on('save-slides', async (data, callback) => {
            try {
                const { roomPin, slides } = data
                const room = await Room.findOne({ roomPin })
                console.log(room.slides)
                if (!room) {
                    return callback({
                        success: false,
                        message: "Room not found"
                    })
                }
                room.slides = slides
                await room.save()
                if (activeRooms[roomPin].hostId !== socket.id) {
                    return callback({
                        success: false,
                        message: "Only host can save slides"
                    })
                }
                if (activeRooms[roomPin]) {
                    activeRooms[roomPin].slides = slides
                }
                callback({
                    success: true,
                    message: "Slides saved successfully"
                })
            } catch (err) {
                callback({
                    success: false,
                    message: "Failed to save slides"
                })
            }
        })

        socket.on('start-quiz', async (data, callback) => {
            try {
                const { roomPin } = data
                const room = await Room.findOne({ roomPin })
                if (!room) {
                    return callback({
                        success: false,
                        message: "Room not found"
                    })
                }
                const activeRoom = activeRooms[roomPin]
                if (!activeRoom) {
                    return callback({
                        success: false,
                        message: "ActiveRoom not found"
                    })
                }
                if (slides.length === 0) {
                    return callback({
                        success: false,
                        message: "no Slides found"
                    })
                }
                activeRooms.currentSlideIndex = 0;
                const firstSlide = room.slides[0]
                activerRoom.gameState = firstSlide.type
                room.currentSlideIndex = 0
                room.gameState = firstSlide.type
                room.isLive = true
                await room.save()
                io.to(roomPin).emit('slide-updated', {
                    currentSlide: firstSlide,
                    gameState: firstSlide.type
                })
                callback({
                    success: true
                });
            } catch (err) {

                console.log(err);

                callback({
                    success: false,
                    message:
                        "Failed to start quiz"
                });
            }
        })

        socket.on('change-state', async (data) => {
            try {
                const { roomPin, gameState } = data
                const room = activeRooms[roomPin]
                if (!room) {
                    return
                }
                room.gameState = gameState
                await Room.findOneAndUpdate({ roomPin }, { gameState })
                io.to(roomPin).emit('state-update', {
                    gameState
                })
            } catch (err) {

            }
        })

        socket.on('next-slide', async (data) => {
            try {
                const { roomPin } = data

                const room = activeRooms[roomPin]
                if (!room) {
                    return
                }

                room.currentSlideIndex++
                if (
                    room.currentSlideIndex >=
                    room.slides.length
                ) {
                    return
                }
                const currentSlide = room.slides[room.currentSlideIndex]
                if (!currentSlide) {

                    room.gameState = "FINAL"

                    await Room.findOneAndUpdate({ roomPin }, {
                        gameState: "FINAL"
                    }
                    )
                    io.to(roomPin).emit(
                        "state-update",
                        {
                            gameState: "FINAL"
                        }
                    )
                    return
                }

                if (currentSlide.type === "MCQ") {
                    room.participants.forEach(
                        participant => {
                            participant.hasAnswered =
                                false
                            participant.selectedAnswer =
                                ""
                        }
                    )
                    room.gameState = "MCQ"

                    let timeLeft = currentSlide.timer
                    room.currentTimer = timeLeft


                    if (room.timer) {
                        clearInterval(room.timer)
                    }

                    io.to(roomPin).emit("timer-update", timeLeft)

                    room.timer = setInterval(async () => {
                        timeLeft--
                        room.currentTimer = timeLeft
                        io.to(roomPin).emit(
                            "timer-update",
                            timeLeft
                        )
                        if (timeLeft <= 0) {
                            clearInterval(room.timer)
                            room.gameState = "LEADERBOARD"
                            await Room.findOneAndUpdate(
                                { roomPin },
                                {
                                    gameState: "LEADERBOARD"
                                }
                            )
                            const leaderboard =
                                [...room.participants]
                                    .sort(
                                        (a, b) =>
                                            b.score - a.score
                                    )

                            io.to(roomPin).emit(
                                "leaderboard-update",
                                leaderboard
                            )
                        }

                    }, 1000)
                }

                else if (currentSlide.type === "QNA") {
                    room.gameState = "QNA"
                }

                else {
                    room.gameState = "SLIDE"
                }

                await Room.findOneAndUpdate(
                    { roomPin },
                    {
                        currentSlideIndex:
                            activeRooms[roomPin].currentSlideIndex,

                        gameState:
                            activeRooms[roomPin].gameState
                    }
                )
                io.to(roomPin).emit(
                    "slide-update",
                    {
                        currentSlide,
                        currentSlideIndex:
                            room.currentSlideIndex,

                        gameState:
                            room.gameState
                    }
                )

            } catch (err) {
                console.log(err)
            }
        })

        socket.on('submit-answer', async (data, callback) => {
            try {
                //roomPin and selectedAnswer of prticipant
                const { roomPin, selectedAnswer } = data

                // finding room by roomPin
                const room = activeRooms[roomPin]
                if (!room) {
                    return
                }
                //getting the current slide
                const currentSlide = room.slides[room.currentSlideIndex]
                if (currentSlide.type !== "MCQ") {
                    return
                }

                // if (room.answers[socket.id]) {
                //     return callback({
                //         success: false,
                //         message: "Already answered"
                //     })
                // }

                const isCorrect =
                    currentSlide.correctAnswer === selectedAnswer
                room.answers[socket.id] = {
                    username:
                        participant.username,
                    selectedAnswer,
                    isCorrect
                }

                const participant = room.participants.find((user) => user.socketId === socket.id)
                participant.selectedAnswer = selectedAnswer

                participant.hasAnswered = true

                if (!participant) {
                    return
                }
                let score = 0
                if (isCorrect) {
                    score =
                        Math.floor(
                            1000 * (
                                room.currentTimer /
                                currentSlide.timer
                            )
                        )

                    participant.score += score
                }

                const dbRoom =
                    await Room.findOne({ roomPin })

                if (dbRoom) {

                    const dbParticipant =
                        dbRoom.participants.find(
                            (user) =>
                                user.socketId === socket.id
                        )

                    if (dbParticipant) {
                        dbParticipant.score =
                            participant.score
                    }

                    await dbRoom.save()
                }
                room.participants.sort(
                    (a, b) => b.score - a.score
                )
                room.participants.forEach(
                    (user, index) => {
                        user.rank = index + 1
                    }
                )
                io.to(roomPin).emit(
                    "answers-update",
                    room.answers
                )
                io.to(roomPin).emit(
                    "leaderboard-update",
                    room.participants
                )

                callback({
                    success: true,
                    isCorrect,
                    score
                })


            } catch (err) {
                console.log(err)

                callback({
                    success: false,
                    message: "Internal server error"
                })
            }
        })

        // leave the room 
        // socket.on('leave-room', (callback) => {
        //     const roomPin = socket.roomPin
        //     const username = socket.username
        //     const room = rooms[roomPin]
        //     if (!room) {
        //         return callback({
        //             success: false,
        //             message: "Room not found"
        //         })
        //     }

        //     socket.leave(roomPin)
        //     room.users = room.users.filter(user => user !== username)

        //     io.to(roomPin).emit('room-users', room.users)
        //     io.to(roomPin).emit("system-message", `${username} left the room`)

        //     callback({
        //         success: true
        //     })
        // })


        socket.on("disconnect", async () => {
            try {
                const roomPin = socket.roomPin
                const username = socket.username
                if (!roomPin || !activeRooms[roomPin]) {
                    return
                }

                activeRooms[roomPin].participants = activeRooms[roomPin].participants.filter(user => user.socketId !== socket.id)
                const room = await Room.findOne({ roomPin })
                if (room) {
                    room.participants =
                        room.participants.filter(
                            (user) => user.socketId !== socket.id
                        )
                    await room.save()
                }

                io.to(roomPin).emit("participants-updated", activeRooms[roomPin].participants)

                io.to(roomPin).emit(
                    "system-message",
                    `${username} disconnected`
                )

            } catch (err) {

            }
        })


    })
}


export default socketHandler

