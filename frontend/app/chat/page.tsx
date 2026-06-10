"use client";

import { useState, useRef, useEffect } from "react";
import { chatApi, ChatMessage } from "@/lib/api";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function ChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: 'Hello! I am your data assistant. You can ask me questions about your data, and I will provide insights, SQL queries, and visualizations. Try asking something like "What were the total sales last month?" or "Show me the top 5 products by revenue."',
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Load suggestions on mount
    useEffect(() => {
        chatApi.getSuggestions().then(setSuggestions).catch(() => {});
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function sendMessage(text: string) {
        if (!text.trim() || loading) return;

        const userMessage: ChatMessage = { role: 'user', content: text };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
            const response = await chatApi.sendMessage(text, history);

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: response.message,
                    sql_query: response.sql_query ?? undefined,
                    data: response.data ?? undefined,
                    chart_type: response.chart_type ?? undefined,
                },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Sorry, something went wrong. Please try again.',
                },
            ]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <h1 className="text-lg font-semibold text-gray-900">
                    AI Analytics Assistant
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                    Ask questions about your data in plain English
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                        {/* Avatar */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5 ${
                            msg.role === "assistant"
                                ? "bg-violet-100 text-violet-700"
                                : "bg-gray-200 text-gray-600"
                        }`}>
                            {msg.role === "assistant" ? "AI" : "You"}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[75%] rounded-xl px-4 py-3 ${
                            msg.role === "assistant"
                                ? "bg-white border border-gray-200"
                                : "bg-violet-600 text-white"
                        }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {msg.content}
                            </p>

                            {/* SQL disclosure */}
                            {msg.sql_query && (
                                <details className="mt-2">
                                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                                        View SQL
                                    </summary>
                                    <pre className="mt-1.5 text-xs bg-gray-50 rounded p-2 overflow-x-auto text-gray-700 whitespace-pre-wrap">
                                        {msg.sql_query}
                                    </pre>
                                </details>
                            )}

                            {/* Bar chart */}
                            {msg.data && msg.chart_type === "bar" && msg.data.length > 0 && (
                                <div className="mt-3">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={msg.data}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey={Object.keys(msg.data[0])[0]}
                                                tick={{ fontSize: 10 }}
                                                tickFormatter={(v: string) =>
                                                    v.length > 15 ? v.slice(0, 15) + "…" : v
                                                }
                                            />
                                            <YAxis tick={{ fontSize: 10 }} />
                                            <Tooltip />
                                            <Bar
                                                dataKey={Object.keys(msg.data[0])[2] || Object.keys(msg.data[0])[1]}
                                                fill="#7c3aed"
                                                radius={[3, 3, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Table */}
                            {msg.data && msg.chart_type === "table" && msg.data.length > 0 && (
                                <div className="mt-3 overflow-x-auto">
                                    <table className="text-xs w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                {Object.keys(msg.data[0]).map(k => (
                                                    <th key={k} className="text-left py-1 px-2 text-gray-500 font-medium">
                                                        {k}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {msg.data.slice(0, 10).map((row, ri) => (
                                                <tr key={ri} className="border-b border-gray-100">
                                                    {Object.values(row).map((v, vi) => (
                                                        <td key={vi} className="py-1 px-2 text-gray-700">
                                                            {typeof v === "number"
                                                                ? v.toLocaleString()
                                                                : String(v)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-medium text-violet-700">
                            AI
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Suggestions — shown only at start */}
            {messages.length === 1 && suggestions.length > 0 && (
                <div className="px-6 pb-3">
                    <p className="text-xs text-gray-400 mb-2">Try asking:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {suggestions.slice(0, 4).map(s => (
                            <button
                                key={s}
                                onClick={() => sendMessage(s)}
                                className="text-left text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage(input)}
                        placeholder="Ask anything about your data..."
                        className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                        disabled={loading}
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={loading || !input.trim()}
                        className="px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors text-sm"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}