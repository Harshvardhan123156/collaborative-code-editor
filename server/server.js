/*import express from "express"
import http from "http"
import cors from "cors"
import { Server } from "socket.io"

const app=express()

app.use(cors())
const server =http.createServer(app)

const io=new Server(server,{
    cors:{
        origin:'*',
    },
})

const userRooms={};
const rooms={};
const roomCodes={};
const roomLanguages={};

io.on("connection",(socket)=>{

    socket.on("join-room",(roomId)=>{

        if(!roomLanguages[roomId]){
            roomLanguages[roomId]="javascript"
        }
        socket.emit("language-update",roomLanguages[roomId])

        if(userRooms[socket.id]){
            return;
        }

        const username = `User ${rooms[roomId].length+1}`;
        socket.emit("user-info", username);
        rooms[roomId].push({
            id: socket.id,
            username: username
        });
        userRooms[socket.id] = roomId;
        socket.emit("user-info", username);

        if(!rooms[roomId]){
            rooms[roomId]=[]
        }
        rooms[roomId].push(socket.id)
        userRooms[socket.id]=roomId

        socket.join(roomId);
        if(!roomCodes[roomId]){
            roomCodes[roomId]=""
        }
        socket.emit("room-joined",roomId);
        socket.emit("code-update",roomCodes[roomId]);
        console.log(`${socket.id} has joined ${roomId}`);
        io.to(roomId).emit("users-update", rooms[roomId]);
        io.to(roomId).emit("user-count",rooms[roomId].length);
    });

    socket.on("language-changed",(data)=>{
        roomLanguages[data.roomId]=data.language
        socket.to(data.roomId).emit("language-update",data.language);
    });

    socket.on("code-changed",(data)=>{
        console.log("SERVER RECEIVED:", data);
        socket.to(data.roomId).emit("code-update",data.code);
        roomCodes[data.roomId]=data.code;
        console.log("SEnt to:",data.roomId)
    })

    socket.on("leave-room",()=>{
        const roomId = userRooms[socket.id];
        if(roomId && rooms[roomId]){
            rooms[roomId] = rooms[roomId].filter(user => user.id !== socket.id);
            socket.leave(roomId);
            io.to(roomId).emit("user-count", rooms[roomId].length);
            io.to(roomId).emit("users-update", rooms[roomId]);
            if(rooms[roomId].length === 0){
                delete rooms[roomId];
                delete roomCodes[roomId];
                delete roomLanguages[roomId];
            }
        }
        delete userRooms[socket.id];
    });

    socket.on("disconnect",()=>{
        const roomId=userRooms[socket.id];

        if(roomId && rooms[roomId]){
            rooms[roomId]=rooms[roomId].filter(user=> user.id!==socket.id)
            socket.to(roomId).emit("user-left",socket.id)
            socket.to(roomId).emit("user-count",rooms[roomId].length)
            if(rooms[roomId].length==0){
                delete rooms[roomId]
                delete roomCodes[roomId]
                delete roomLanguages[roomId];
            }
        }
        delete userRooms[socket.id]
        console.log("User disconnected:",socket.id)
    })

});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});*/
import express from "express";
import http from "http";
import cors from "cors";
import axios from "axios";
import { Server } from "socket.io";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("CodeCollab server is running!");
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

const userRooms = {};
const rooms = {};
const roomCodes = {};
const roomLanguages = {};


app.post("/execute", async (req, res) => {

    const { code, language } = req.body;

    const languageId = {
        javascript: 63,
        python: 71,
        cpp: 54,
        java: 62,
    };

    if (!code || !language) {
        return res.status(400).json({
            output: "Code and language are required.",
        });
    }

    if (!languageId[language]) {
        return res.status(400).json({
            output: "Unsupported language.",
        });
    }

    try {

        const response = await axios.post(
            "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
            {
                source_code: code,
                language_id: languageId[language],
            }
        );

        const result = response.data;

        let output = "";

        if (result.stdout) {
            output = result.stdout;
        }
        else if (result.stderr) {
            output = result.stderr;
        }
        else if (result.compile_output) {
            output = result.compile_output;
        }
        else if (result.message) {
            output = result.message;
        }
        else {
            output = "No output";
        }

        res.json({
            output: output,
        });

    } catch (error) {
        console.log("EXECUTION ERROR:", error.response?.data || error.message);
        res.status(500).json({ output: "Code execution failed." });
    }
});

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    socket.emit("connection-status", true);


    // JOIN ROOM
    socket.on("join-room", (roomId) => {

        if (!roomId.trim()) return;

        if (userRooms[socket.id]) {
            return;
        }

        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }

        const username = `User ${rooms[roomId].length + 1}`;

        rooms[roomId].push({
            id: socket.id,
            username: username,
        });

        userRooms[socket.id] = roomId;

        socket.join(roomId);


        // Initialize room state
        if (!roomCodes[roomId]) {
            roomCodes[roomId] = "";
        }

        if (!roomLanguages[roomId]) {
            roomLanguages[roomId] = "javascript";
        }


        // Send current room state
        socket.emit("room-joined", roomId);

        socket.emit("user-info", username);

        socket.emit(
            "code-update",
            roomCodes[roomId]
        );

        socket.emit(
            "language-update",
            roomLanguages[roomId]
        );


        // Update everyone
        io.to(roomId).emit(
            "users-update",
            rooms[roomId]
        );

        io.to(roomId).emit(
            "user-count",
            rooms[roomId].length
        );

        console.log(
            `${username} (${socket.id}) joined ${roomId}`
        );
    });


    // LANGUAGE CHANGE
    socket.on("language-changed", (data) => {

        roomLanguages[data.roomId] = data.language;

        socket.to(data.roomId).emit(
            "language-update",
            data.language
        );
    });


    // CODE CHANGE
    socket.on("code-changed", (data) => {

        roomCodes[data.roomId] = data.code;

        socket.to(data.roomId).emit(
            "code-update",
            data.code
        );
    });


    // LEAVE ROOM
    socket.on("leave-room", () => {
        const roomId = userRooms[socket.id];

        if (roomId && rooms[roomId]) {

            rooms[roomId] = rooms[roomId].filter(
                user => user.id !== socket.id
            );
            socket.leave(roomId)

            io.to(roomId).emit(
                "user-count",
                rooms[roomId].length
            );

            io.to(roomId).emit(
                "users-update",
                rooms[roomId]
            );


            if (rooms[roomId].length === 0) {

                delete rooms[roomId];
                delete roomCodes[roomId];
                delete roomLanguages[roomId];
            }
        }
        delete userRooms[socket.id];
    });


    // DISCONNECT
    socket.on("disconnect", () => {

        const roomId = userRooms[socket.id];
        if (roomId && rooms[roomId]) {
            rooms[roomId] = rooms[roomId].filter(
                user => user.id !== socket.id
            );

            io.to(roomId).emit(
                "user-count",
                rooms[roomId].length
            );

            io.to(roomId).emit(
                "users-update",
                rooms[roomId]
            );


            if (rooms[roomId].length === 0) {
                delete rooms[roomId];
                delete roomCodes[roomId];
                delete roomLanguages[roomId];
            }
        }

        delete userRooms[socket.id];

        console.log(
            "User disconnected:",
            socket.id
        );
    });

});


server.listen(process.env.PORT ||5000, () => {
    console.log("Server running on port 5000");
});