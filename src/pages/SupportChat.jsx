import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import toast from "react-hot-toast";

import VERY_BASE_URL from "../api/veryBase.js";

const ENDPOINT = VERY_BASE_URL; // Change to your backend
const NOTIF_SOUND = "/notif.mp3"; // Place notif.mp3 in /public

let socket;

const SupportChat = () => {
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null); // { socketId, name, ... }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const messagesEndRef = useRef(null);
  const prevWaitingCount = useRef(0);

  useEffect(() => {
    socket = io(ENDPOINT);

    socket.emit("get-waiting-list");

    socket.on("waiting-list", (users) => {
      // Only show toast/sound if the number of waiting users increases
      if (users.length > prevWaitingCount.current) {
        const newUser = users[users.length - 1];
        // Play sound
        const audio = new Audio(NOTIF_SOUND);
        audio.play();
        // Show toast
        toast(
          `New support request from ${newUser?.name || newUser?.phone || newUser?.email || "User"
          }: ${newUser?.category || ""} - ${newUser?.subject || ""}`,
          { icon: "💬" }
        );
      }
      prevWaitingCount.current = users.length;
      setWaitingUsers(users);
    });
    socket.on("chat-started", ({ userSocketId }) => setChatStarted(true));
    socket.on("message", (msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const acceptUser = (user) => {
    setCurrentUser(user);
    setMessages([]);
    socket.emit("admin-accept", { userSocketId: user.socketId, adminName });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input || !chatStarted) return;
    socket.emit("message", { text: input, from: adminName });
    setMessages((prev) => [...prev, { from: "You", text: input }]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-2">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#1A1F31]">Support Chat (Admin)</h2>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">Logged in as:</span>
            <input
              className="border rounded px-2 py-1 text-sm w-24"
              value={adminName}
              onChange={e => setAdminName(e.target.value)}
              placeholder="Admin"
            />
          </div>
        </div>
        {!chatStarted || !currentUser ? (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2 text-[#1A1F31]">
              Waiting Customers
            </h3>
            {waitingUsers.length === 0 ? (
              <div className="text-gray-500">No customers waiting...</div>
            ) : (
              <ul className="space-y-2">
                {waitingUsers.map((user) => (
                  <li
                    key={user.socketId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 px-3 py-2 rounded"
                  >
                    <div className="mb-2 sm:mb-0">
                      <div className="font-semibold">
                        {/* Show name, phone, and email if available */}
                        {user.name || "User"}
                        {user.phone && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({user.phone})
                          </span>
                        )}
                        {user.email && (
                          <span className="ml-2 text-xs text-gray-500">
                            {user.email}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 ml-2">
                          {user.socketId.slice(-6)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-700">
                        <span className="font-semibold">Category:</span> {user.category} <br />
                        <span className="font-semibold">Subject:</span> {user.subject} <br />
                        {user.desc && (
                          <>
                            <span className="font-semibold">Description:</span> {user.desc}
                            <br />
                          </>
                        )}
                        {user.time && (
                          <>
                            <span className="font-semibold">Requested at:</span>{" "}
                            {new Date(user.time).toLocaleString()}
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      className="mt-2 sm:mt-0 bg-[#1A1F31] text-white px-3 py-1 rounded hover:bg-[#232846]"
                      onClick={() => acceptUser(user)}
                    >
                      Accept Chat
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-4">
            <div className="mb-3 text-sm text-gray-600 text-center">
              Chatting with{" "}
              <span className="font-bold text-[#1A1F31]">
                {currentUser.name || currentUser.phone || currentUser.email || "User"}
              </span>
              {(currentUser.phone || currentUser.email) && (
                <span className="text-xs text-gray-500 ml-2">
                  {currentUser.phone && `(${currentUser.phone}) `}
                  {currentUser.email && currentUser.email}
                </span>
              )}
            </div>
            {/* Show issue details above the chat */}
            <div className="bg-gray-100 rounded px-3 py-2 mb-3 text-xs text-[#1A1F31]">
              <div>
                <span className="font-bold">Category:</span> {currentUser.category}
              </div>
              <div>
                <span className="font-bold">Subject:</span> {currentUser.subject}
              </div>
              {currentUser.desc && (
                <div>
                  <span className="font-bold">Description:</span> {currentUser.desc}
                </div>
              )}
              {currentUser.time && (
                <div>
                  <span className="font-bold">Requested at:</span>{" "}
                  {new Date(currentUser.time).toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto mb-2" style={{ minHeight: "200px" }}>
              {messages.map((msg, i) => (
                <div key={i} className={`mb-1 ${msg.from === "You" ? "text-right" : "text-left"}`}>
                  <span className="font-semibold">{msg.from}: </span>
                  <span>{msg.text}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 px-3 py-2 rounded"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={!chatStarted}
              />
              <button
                type="submit"
                className="bg-[#1A1F31] text-white px-4 py-2 rounded hover:bg-[#232846]"
                disabled={!chatStarted}
              >
                Send
              </button>
            </form>
            <button
              className="mt-4 text-xs text-blue-500 underline"
              onClick={() => {
                setCurrentUser(null);
                setChatStarted(false);
                setMessages([]);
                socket.emit("get-waiting-list");
              }}
            >
              End Chat / Return to Waiting List
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportChat;
