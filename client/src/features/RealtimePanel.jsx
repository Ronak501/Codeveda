import { useEffect, useMemo, useState } from "react";

export default function RealtimePanel({ socket, currentUser }) {
  const [connected, setConnected] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [body, setBody] = useState("");
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState("Connect to chat and notifications");

  const roomLabel = useMemo(() => `user:${currentUser.id}`, [currentUser.id]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleReady = () => {
      setConnected(true);
      setStatus(`Connected to ${roomLabel}`);
      socket.emit("notifications:fetch", (response) => {
        if (response?.ok) {
          setNotifications(response.notifications || []);
        }
      });
    };

    const handleDisconnect = () => {
      setConnected(false);
      setStatus("Disconnected");
    };

    const handleMessage = (message) => {
      setMessages((current) => [...current, message]);
    };

    const handleNotification = (notification) => {
      setNotifications((current) => [notification, ...current]);
      setStatus(`New ${notification.type} notification`);
    };

    socket.on("socket:ready", handleReady);
    socket.on("disconnect", handleDisconnect);
    socket.on("chat:message", handleMessage);
    socket.on("notification:new", handleNotification);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("socket:ready", handleReady);
      socket.off("disconnect", handleDisconnect);
      socket.off("chat:message", handleMessage);
      socket.off("notification:new", handleNotification);
    };
  }, [roomLabel, socket]);

  const sendMessage = () => {
    if (!recipientId.trim() || !body.trim()) {
      setStatus("Recipient and message are required");
      return;
    }

    socket.emit(
      "chat:send",
      { recipientId: recipientId.trim(), body: body.trim() },
      (response) => {
        if (!response?.ok) {
          setStatus(response?.message || "Unable to send message");
          return;
        }

        setBody("");
        setStatus("Message delivered");
      },
    );
  };

  return (
    <section className="panel realtime-panel">
      <div className="panel-head">
        <div>
          <h3>Realtime Chat</h3>
          <p className="muted small">{status}</p>
        </div>
        <span className={connected ? "badge success" : "badge"}>
          {connected ? "Live" : "Offline"}
        </span>
      </div>

      <div className="form-grid">
        <label htmlFor="recipient-id">Recipient User ID</label>
        <input
          id="recipient-id"
          value={recipientId}
          onChange={(event) => setRecipientId(event.target.value)}
          placeholder="Paste another user id"
        />
        <label htmlFor="message-body">Message</label>
        <textarea
          id="message-body"
          rows={3}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Type a direct message"
        />
        <button type="button" onClick={sendMessage} disabled={!connected}>
          Send Private Message
        </button>
      </div>

      <div className="two-col">
        <div>
          <h4>Live Messages</h4>
          <div className="stack-list">
            {messages.length ? (
              messages.map((message) => (
                <article
                  key={message.id || `${message.createdAt}-${message.body}`}
                  className="mini-card"
                >
                  <strong>
                    {message.sender?.name || "Unknown"} to{" "}
                    {message.recipient?.name || "Unknown"}
                  </strong>
                  <p>{message.body}</p>
                </article>
              ))
            ) : (
              <p className="muted">No live messages yet.</p>
            )}
          </div>
        </div>
        <div>
          <h4>Notifications</h4>
          <div className="stack-list">
            {notifications.length ? (
              notifications.map((notification) => (
                <article
                  key={
                    notification.id ||
                    `${notification.createdAt}-${notification.title}`
                  }
                  className="mini-card"
                >
                  <strong>{notification.title}</strong>
                  <p>{notification.body}</p>
                </article>
              ))
            ) : (
              <p className="muted">No notifications yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
