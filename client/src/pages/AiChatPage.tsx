import { useState } from "react";
import { Button } from "@/components/ui/button";
import { askAiChat, type AiChatSource } from "@/services/stitchlogApi";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: AiChatSource[];
};

function renderMessageText(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

    if (linkMatch) {
      const [, label, url] = linkMatch;

      return (
        <a
          key={`${url}-${index}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-sky-600 underline decoration-sky-300 underline-offset-2 transition hover:text-sky-700"
        >
          {label}
        </a>
      );
    }

    const textSegments = part.split(/(\*\*[^*]+\*\*)/g);

    return (
      <span key={`text-${index}`} className="whitespace-pre-wrap">
        {textSegments.map((segment, segmentIndex) => {
          const boldMatch = segment.match(/^\*\*([^*]+)\*\*$/);

          if (boldMatch) {
            return (
              <strong key={`bold-${index}-${segmentIndex}`} className="font-semibold text-slate-800">
                {boldMatch[1]}
              </strong>
            );
          }

          return <span key={`segment-${index}-${segmentIndex}`}>{segment}</span>;
        })}
      </span>
    );
  });
}

export function AiChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text:
        "Ask about your indexed projects and I’ll answer from the RAG collection. " +
        "Created with OpenAI embeddings and MongoDB vector search from your project data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: message,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await askAiChat(message);

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: response.answer,
          sources: response.sources,
        },
      ]);
    } catch (submitError) {
      console.error(submitError);
      setError("Failed to get AI response.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-rose-100/70 bg-white/35 p-6 shadow-[0_18px_50px_rgba(242,193,209,0.18)] backdrop-blur-md sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">AI Chat</p>
      <h2 className="mt-2 text-2xl text-slate-700 sm:text-3xl">AI Stitching Assistance</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
        Get the recommendations and insights about your projects with AI-powered answers based on your project library.
      </p>

      <div className="mt-8 rounded-[1.75rem] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(255,245,248,0.9)_100%)] p-4 shadow-[0_16px_40px_rgba(221,160,181,0.12)] sm:p-5">
        <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
          {messages.map((message) => (
            <article
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto max-w-2xl rounded-[1.4rem] bg-rose-500 px-4 py-3 text-sm text-white shadow-[0_14px_30px_rgba(244,114,182,0.22)]"
                  : "mr-auto max-w-3xl rounded-[1.4rem] border border-rose-100 bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_10px_25px_rgba(148,163,184,0.08)]"
              }
            >
              <p className="leading-7">{renderMessageText(message.text)}</p>

              {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                <div className="mt-4 border-t border-rose-100 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-300">
                    Matching projects
                  </p>
                  <div className="mt-2 space-y-2">
                    {message.sources.map((source) => (
                      <div key={source.notionPageId} className="rounded-2xl bg-rose-50/70 px-3 py-2">
                        <p className="text-sm font-semibold text-slate-700">
                          {source.title ?? "Untitled project"}
                        </p>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex text-xs font-medium text-sky-600 transition hover:text-sky-700 hover:underline"
                          >
                            Open project
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}

          {loading && (
            <article className="mr-auto max-w-xl rounded-[1.4rem] border border-rose-100 bg-white px-4 py-3 text-sm text-slate-500">
              Thinking through your project library...
            </article>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}

        <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={3}
            placeholder="Ask about your projects, fabrics, designers, size, or notes..."
            className="min-h-[88px] flex-1 rounded-[1.4rem] border border-rose-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-rose-300"
          />
          <Button
            type="submit"
            className="h-12 rounded-full bg-rose-500 px-6 text-sm font-semibold text-white hover:bg-rose-600 sm:self-end"
            disabled={loading}
          >
            {loading ? "Asking..." : "Send"}
          </Button>
        </form>
      </div>
    </section>
  );
}
