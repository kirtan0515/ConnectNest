import { GraphQLAPI, graphqlOperation } from '@aws-amplify/api-graphql';
import { listChatMessages } from "../../graphql/queries";
import { createChatMessage } from "../../graphql/mutations";
import { useEffect, useState } from "react";

const Chats = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const messageData = await GraphQLAPI.graphql(graphqlOperation(listChatMessages));
      setMessages(messageData.data.listChatMessages.items);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage) return;

    try {
      await GraphQLAPI.graphql(graphqlOperation(createChatMessage, { input: { sender: "currentUser", content: newMessage, timestamp: new Date().toISOString() } }));
      fetchMessages();
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Chat</h2>
      <div className="border p-2 rounded h-64 overflow-auto">
        {messages.map((msg) => (
          <div key={msg.id} className="p-1">
            <strong>{msg.sender}: </strong> {msg.content}
          </div>
        ))}
      </div>
      <input 
        type="text" 
        placeholder="Type a message" 
        value={newMessage} 
        onChange={(e) => setNewMessage(e.target.value)} 
        className="border p-2 rounded w-full mt-2" 
      />
      <button 
        onClick={sendMessage} 
        className="mt-2 p-2 bg-green-500 text-white rounded"
      >
        Send
      </button>
    </div>
  );
};

export default Chats;
