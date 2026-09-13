import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import Header from "./components/Header";
import socket from "./socket.js";
import { starterCode } from "./data/starterCode.js";
import "./App.css";

function App() {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Start coding here");
  const [theme, setTheme] = useState("vs-dark");

  const [roomId, setRoomId] = useState("");
  const [userCount, setUserCount] = useState(0);
  const [users, setUsers] = useState([]);

  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [connected, setConnected] = useState(false);

  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // JOIN ROOM
  const joinRoom = () => {
    if (!roomId.trim()) return;

    if (joined) {
      socket.emit("leave-room");
    }

    socket.emit("join-room", roomId.trim());
  };

  // LEAVE ROOM
  const leaveRoom = () => {
    socket.emit("leave-room");

    setJoined(false);
    setRoomId("");
    setUsers([]);
    setUserCount(0);
    setUsername("");
    setCode("// Start coding here");
    setLanguage("javascript");
    setOutput("");
  };

  // CODE CHANGE
  const codeChange = (value) => {
    setCode(value);

    if (!joined) return;

    socket.emit("code-changed", {
      roomId,
      code: value,
    });
  };

  // LANGUAGE CHANGE
  const changeLanguage = (value) => {
    setLanguage(value);
    setCode(starterCode[value]);

    if (!joined) return;

    socket.emit("language-changed", {
      roomId,
      language: value,
    });
  };

  // RUN CODE
  const runCode = async () => {
    setIsRunning(true);
    setOutput("Running...");

    try {
      const response = await fetch(
        "https://collaborative-code-editor-hgir.onrender.com/execute",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            language,
          }),
        }
      );

      const data = await response.json();

      setOutput(data.output);
    } catch (error) {
      setOutput("Could not connect to execution server.");
    }

    setIsRunning(false);
  };

  // SOCKET LISTENERS
  useEffect(() => {
    socket.on("connection-status", (status) => {
      setConnected(status);
    });

    socket.on("room-joined", (room) => {
      setJoined(true);
      setRoomId(room);
    });

    socket.on("user-info", (name) => {
      setUsername(name);
    });

    socket.on("users-update", (users) => {
      setUsers(users);
    });

    socket.on("user-count", (count) => {
      setUserCount(count);
    });

    socket.on("language-update", (language) => {
      setLanguage(language);
      setCode(starterCode[language]);
    });

    socket.on("code-update", (value) => {
      setCode(value);
    });

    return () => {
      socket.off("connection-status");
      socket.off("room-joined");
      socket.off("user-info");
      socket.off("users-update");
      socket.off("user-count");
      socket.off("language-update");
      socket.off("code-update");
    };
  }, []);

  return (
    <div className={`app ${theme === "light" ? "light" : ""}`}>

      <Header
        language={language}
        setLanguage={changeLanguage}
        setCode={setCode}
        theme={theme}
        setTheme={setTheme}
        joined={joined}
        runCode={runCode}
        isRunning={isRunning}
      />

      <div className="workspace">

        {/* SIDEBAR */}
        <aside className="sidebar">

          <div className="sidebar-section">
            <div className="section-title">
              ROOM
            </div>

            <div className="room-input-row">
              <input
                type="text"
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                disabled={joined}
              />

              {!joined ? (
                <button
                  className="join-btn"
                  onClick={joinRoom}
                >
                  Join
                </button>
              ) : (
                <button
                  className="leave-btn"
                  onClick={leaveRoom}
                >
                  Leave
                </button>
              )}
            </div>

            <div className="connection">
              <span
                className={`status-dot ${
                  connected ? "online" : "offline"
                }`}
              />

              {connected ? "Connected" : "Disconnected"}
            </div>
          </div>


          {joined && (
            <div className="sidebar-section users-section">

              <div className="section-title">
                EDITORS
                <span>{userCount}</span>
              </div>

              <div className="users-list">

                {users.map((user) => (
                  <div
                    className="user-item"
                    key={user.id}
                  >
                    <span className="user-dot" />

                    <span>
                      {user.username}
                    </span>

                    {user.username === username && (
                      <span className="you">
                        You
                      </span>
                    )}
                  </div>
                ))}

              </div>

            </div>
          )}

          {!joined && (
            <div className="empty-sidebar">
              Join a room to start collaborating.
            </div>
          )}

        </aside>


        {/* MAIN EDITOR */}
        <main className="editor-area">

          <div className="editor-tab">

            <span className="file-icon">
              ●
            </span>

            <span>
              main.{language === "javascript"
                ? "js"
                : language === "python"
                ? "py"
                : language === "cpp"
                ? "cpp"
                : "java"}
            </span>

            {!joined && (
              <span className="read-only-label">
                Read only
              </span>
            )}

          </div>

          <div className="monaco-wrapper">

            <Editor
              height="100%"
              language={language}
              value={code}
              theme={theme}
              onChange={codeChange}
              options={{
                readOnly: !joined,
                minimap: {
                  enabled: false,
                },
                fontSize: 14,
                padding: {
                  top: 12,
                },
                smoothScrolling: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />

          </div>


          {/* CONSOLE */}
          <section className="console">

            <div className="console-header">

              <span>
                Console
              </span>

              <button
                onClick={() => setOutput("")}
              >
                Clear
              </button>

            </div>

            <pre className="console-output">
              {output || "Output will appear here..."}
            </pre>

          </section>

        </main>

      </div>

    </div>
  );
}

export default App;