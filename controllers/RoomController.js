import Room from "../models/RoomModel.js"

const generateRoomPin = () => {
    return Math.floor(100000 + Math.random() * 9000).toString()
}

const createRoomController = async (req, res) => {
    try {
        let roomPin = generateRoomPin()
        let existingRoom;
        do {
            roomPin = generateRoomPin();
            existingRoom = await Room.findOne({ roomPin });
        } while (existingRoom);

        await Room.create({ roomPin })
        res.status(200).json({
            success: true,
            roomPin,
            message: "Room created successfully"
        })
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
}

export default createRoomController