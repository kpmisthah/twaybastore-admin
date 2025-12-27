// AdminBroadcastPage.jsx
import React, { useState } from "react";
import axios from "axios";
import configadmin from '../api/configadmin'
export default function AdminBroadcastPage() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);

  // 🚫 Common banned or sensitive words (can expand)
  const bannedWords = [
    "spam", "scam", "fake", "nsfw", "hate", "kill", "sex",
    "violence", "bomb", "terror", "porn", "drugs"
  ];

  const checkForUnsafeContent = (text) => {
    const lower = text.toLowerCase();
    return bannedWords.some((w) => lower.includes(w));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setMessage("");

    // ✅ Basic safety validation
    if (!subject.trim() || !content.trim()) {
      return setMessage("⚠️ Please fill both subject and content before sending.");
    }

    if (checkForUnsafeContent(subject) || checkForUnsafeContent(content)) {
      return setMessage("🚫 The email contains restricted or inappropriate words. Please revise.");
    }

    const wordCount = content.replace(/<[^>]+>/g, "").split(/\s+/).length;
    if (wordCount < 5) {
      return setMessage("⚠️ The message is too short. Please write a proper greeting or content.");
    }
    // ⚠️ Confirmation before sending ///
    const confirmSend = window.confirm(
      `You’re about to send this email to ALL users.\n\nSubject: ${subject}\n\nAre you sure you want to proceed?`
    );
    if (!confirmSend) return;

    setSending(true);
    try {
      const res = await axios.post(`${configadmin}/admin/send-broadcast`, { subject, content });
      setMessage("✅ " + (res.data.message || "Email sent successfully!"));
      setSubject("");
      setContent("");
      setPreview(false);
    } catch (err) {
      setMessage("❌ Failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-blue-800">Send Broadcast Email</h1>

      <form onSubmit={handleSend} className="space-y-4">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email Subject"
          className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your HTML content here..."
          rows={10}
          className="w-full border border-gray-300 p-3 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-5 py-2 rounded"
          >
            {preview ? "Hide Preview" : "Preview"}
          </button>

          <button
            type="submit"
            disabled={sending}
            className={`${
              sending ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            } text-white font-semibold px-6 py-2 rounded`}
          >
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </form>

      {message && (
        <p className="mt-4 text-sm font-medium text-gray-700">{message}</p>
      )}

      {/* Live Preview */}
      {preview && (
        <div className="mt-8 border rounded p-4 bg-white shadow-inner">
          <h2 className="text-lg font-bold mb-2 text-blue-700">📧 Email Preview:</h2>
          <div
            className="prose max-w-none border-t pt-3"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}
    </div>
  );
}
