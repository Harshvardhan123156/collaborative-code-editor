import { io } from "socket.io-client";
const socket = io("https://collaborative-code-editor-hgir.onrender.com");
export default socket;