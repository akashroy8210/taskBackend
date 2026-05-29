import mongoose, { Schema } from "mongoose"

const participantSchema = new mongoose.Schema({
    socketId: {
        type: String
    },
    username: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        default: 0
    },
    rank: {
        type: Number,
        default: 0
    }
}, { timestamps: true })


const slideSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["INFO", "MCQ", "QNA"],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    question: {
        type: String,
    },
    content: {
        type: String
    },
    options: {
        type: [String],
        default: []
    },
    correctAnswer: {
        type: String
    },
    timer: {
        type: Number,
        default: 30
    }
})

const RoomModel = new mongoose.Schema({
    roomPin: {
        type: String,
        required: true,
        unique: true
    },
    gameState: {
        type: String,
        enum: ["WAITING", "SLIDE", "MCQ", "LEADERBOARD", "QNA", "FINAL"],
        default: "WAITING",
    },
    currentSlideIndex: {
        type: Number,
        default: 0
    },
    participants: {
        type: [participantSchema],
        default: []
    },
    slides: {
        type: [slideSchema],
        default: [
            {
                type: "INFO",
                title: "Welcome to the Web Development Quiz",
                content:
                    "Test your knowledge of HTML, CSS, JavaScript, React, and Backend Development.",
            },

            {
                type: "MCQ",
                title: "HTML Basics",
                question:
                    "Which HTML tag is used to create a hyperlink?",
                options: [
                    "<a>",
                    "<link>",
                    "<href>",
                    "<hyper>"
                ],
                correctAnswer: "<a>",
                timer: 15
            },

            {
                type: "MCQ",
                title: "CSS Fundamentals",
                question:
                    "Which CSS property is used to change text color?",
                options: [
                    "font-color",
                    "text-color",
                    "color",
                    "background-color"
                ],
                correctAnswer: "color",
                timer: 15
            },

            {
                type: "MCQ",
                title: "JavaScript Concepts",
                question:
                    "Which keyword is used to declare a variable in JavaScript?",
                options: [
                    "int",
                    "string",
                    "let",
                    "define"
                ],
                correctAnswer: "let",
                timer: 15
            },

            {
                type: "MCQ",
                title: "React Basics",
                question:
                    "Which hook is used to manage state in React?",
                options: [
                    "useState",
                    "useFetch",
                    "useData",
                    "useNode"
                ],
                correctAnswer: "useState",
                timer: 15
            },

            {
                type: "MCQ",
                title: "Backend Development",
                question:
                    "Which package is commonly used to create a server in Node.js?",
                options: [
                    "mongoose",
                    "express",
                    "react",
                    "vite"
                ],
                correctAnswer: "express",
                timer: 15
            },

            {
                type: "MCQ",
                title: "Database Knowledge",
                question:
                    "MongoDB is a _____ database.",
                options: [
                    "Relational",
                    "NoSQL",
                    "Graph",
                    "Spreadsheet"
                ],
                correctAnswer: "NoSQL",
                timer: 15
            },

            {
                type: "QNA",
                title: "Ask Question",
                
            }
        ]
    },
    leaderboard: {
        type: [participantSchema],
        default: []
    },
    isLive: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true })

export default mongoose.model("Room", RoomModel)