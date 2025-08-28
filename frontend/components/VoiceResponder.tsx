import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateVoice } from "../lib/api";
import { toast } from "react-hot-toast";
import useSound from "use-sound";
import { Howler } from "howler";
import * as Dialog from "@radix-ui/react-dialog";
import * as Progress from "@radix-ui/react-progress";
import { Volume2, StopCircle, ClipboardCopy, Loader2 } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

const schema = z.object({
    text_to_speak: z.string().min(5, "Text must be at least 5 characters"),
});

type FormData = z.infer<typeof schema>;

const VoiceResponder: React.FC = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormData>({ resolver: zodResolver(schema) });
    const [audioUrl, setAudioUrl] = React.useState("");
    const [language, setLanguage] = React.useState("auto");
    const [toneOverride, setToneOverride] = React.useState("");
    const [mood, setMood] = React.useState("");
    const [responseText, setResponseText] = React.useState("");
    const [play, { stop }] = useSound(audioUrl, {
        soundEnabled: !!audioUrl,
        format: ["mp3"],
        html5: true,
    });

    const normalizeAudioUrl = (u: string): string => {
        if (!u) return "";
        if (/^https?:\/\//i.test(u)) return u;
        if (u.startsWith("/audio/")) return `${window.location.origin}${u}`;
        return u;
    };

    const onSubmit = async (data: FormData) => {
        try {
            const resp = await fetch(
                `${(import.meta as any).env?.VITE_API_BASE_URL || "/api"}/v1/voice/generate-response`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message_text: data.text_to_speak,
                        language,
                        tone_override: toneOverride || null,
                        max_words: 160,
                    }),
                },
            );
            if (!resp.ok) {
                const errBody = await resp.text();
                throw new Error(errBody || "Failed to generate response");
            }
            const res = await resp.json();
            setResponseText(res.response_text || "");
            setMood(res.mood || "");
            const rawUrl = (res && (res.audio_url || res.audioUrl)) || "";
            const finalUrl = normalizeAudioUrl(rawUrl);

            // Preflight fetch to ensure it's actually audio and not an HTML error page
            try {
                const r = await fetch(finalUrl, { method: "GET" });
                const ct = (r.headers.get("content-type") || "").toLowerCase();
                if (!r.ok || !ct.includes("audio")) {
                    throw new Error(`Invalid audio response (${r.status}) ${ct}`);
                }
            } catch (preErr) {
                toast.error("Failed to load generated audio file.");
                setAudioUrl("");
                return;
            }

            setAudioUrl(finalUrl);
            toast.success("Audio generated successfully");
            reset();
        } catch (err: any) {
            toast.error(typeof err === "string" ? err : "Failed to generate audio");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full sm:max-w-xl md:max-w-2xl mx-auto px-2 py-6 bg-white dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow-md"
        >
            <h2 className="text-2xl font-bold mb-2 text-center">Voice Responder</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-3">
                <label htmlFor="text_to_speak" className="text-sm font-medium">
                    Text to speak
                </label>
                <textarea
                    id="text_to_speak"
                    className="w-full h-24 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition dark:bg-gray-800 dark:border-gray-700"
                    placeholder="Enter the message of the empolyee..."
                    {...register("text_to_speak")}
                />
                <div className="text-xs text-gray-500 -mt-1">Keep it concise for best results.</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium" htmlFor="language_select">
                            Language
                        </label>
                        <select
                            id="language_select"
                            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="auto">Auto-detect</option>
                            <option value="en">English</option>
                            <option value="de">Deutsch</option>
                            <option value="ar">العربية</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium" htmlFor="tone_select">
                            Tone (optional)
                        </label>
                        <select
                            id="tone_select"
                            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                            value={toneOverride}
                            onChange={(e) => setToneOverride(e.target.value)}
                        >
                            <option value="">Auto-detect</option>
                            <option value="urgent">Urgent</option>
                            <option value="frustrated">Frustrated</option>
                            <option value="excited">Excited</option>
                            <option value="professional">Professional</option>
                        </select>
                    </div>
                </div>
                {errors.text_to_speak && (
                    <p className="text-red-500 text-sm">{errors.text_to_speak.message}</p>
                )}
                <button
                    type="submit"
                    className={clsx(
                        "w-full px-4 py-2 font-bold text-white rounded transition disabled:opacity-60 flex items-center justify-center gap-2",
                        isSubmitting ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-700",
                        "transition-transform duration-200 hover:scale-105 active:scale-95 shadow hover:shadow-lg",
                        "dark:bg-blue-600 dark:hover:bg-blue-700",
                    )}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin h-5 w-5" />
                            Generating...
                        </>
                    ) : (
                        "Generate Voice"
                    )}
                </button>
            </form>
            {isSubmitting && (
                <div className="mt-3" aria-live="polite" role="status">
                    <Progress.Root
                        className="relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded h-2"
                        style={{ transform: "translateZ(0)" }}
                    >
                        <Progress.Indicator
                            className="bg-blue-500 w-1/2 h-full transition-transform"
                            style={{ transform: "translateX(50%)" }}
                        />
                    </Progress.Root>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Generating audio...
                    </p>
                </div>
            )}
            <Dialog.Root open={!!audioUrl} onOpenChange={() => setAudioUrl("")}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
                    <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow-lg p-6 w-full max-w-md flex flex-col items-center">
                        <Dialog.Title className="text-xl font-bold mb-2">
                            Generated Audio
                        </Dialog.Title>
                        {responseText && (
                            <div className="w-full text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded border dark:border-gray-700 mb-3">
                                <div className="font-semibold mb-1">
                                    Detected mood: {mood || "auto"}
                                </div>
                                <p className="whitespace-pre-line">{responseText}</p>
                            </div>
                        )}
                        <audio
                            controls
                            src={audioUrl}
                            className="mt-2 w-full max-w-xs dark:bg-gray-950 dark:text-gray-100"
                            onError={() => {
                                toast.error(
                                    "Audio failed to play. Please regenerate or try again.",
                                );
                            }}
                        />
                        <div className="flex flex-wrap gap-2 mt-4 justify-center w-full">
                            <button
                                className={clsx(
                                    "px-4 py-2 font-bold text-white rounded flex items-center gap-2 justify-center w-full sm:w-auto",
                                    "bg-green-500 hover:bg-green-700",
                                    "transition-transform duration-200 hover:scale-105 active:scale-95 shadow hover:shadow-lg",
                                    "dark:bg-green-600 dark:hover:bg-green-700",
                                )}
                                onClick={async () => {
                                    try {
                                        // @ts-ignore
                                        if (
                                            Howler &&
                                            (Howler as any).ctx &&
                                            (Howler as any).ctx.state === "suspended"
                                        ) {
                                            // @ts-ignore
                                            await (Howler as any).ctx.resume();
                                        }
                                    } catch {}
                                    play();
                                }}
                                aria-label="Play audio"
                            >
                                <Volume2 className="h-5 w-5" />
                                Play
                            </button>
                            <button
                                className={clsx(
                                    "px-4 py-2 font-bold text-white rounded flex items-center gap-2 justify-center w-full sm:w-auto",
                                    "bg-red-500 hover:bg-red-700",
                                    "transition-transform duration-200 hover:scale-105 active:scale-95 shadow hover:shadow-lg",
                                    "dark:bg-red-600 dark:hover:bg-red-700",
                                )}
                                onClick={() => stop()}
                                aria-label="Stop audio"
                            >
                                <StopCircle className="h-5 w-5" />
                                Stop
                            </button>
                            <button
                                className={clsx(
                                    "px-4 py-2 font-bold text-white rounded flex items-center gap-2 justify-center w-full sm:w-auto",
                                    "bg-blue-500 hover:bg-blue-700",
                                    "transition-transform duration-200 hover:scale-105 active:scale-95 shadow hover:shadow-lg",
                                    "dark:bg-blue-600 dark:hover:bg-blue-700",
                                )}
                                onClick={async () => {
                                    if (navigator.clipboard) {
                                        try {
                                            await navigator.clipboard.writeText(audioUrl);
                                            toast.success("Audio URL copied to clipboard!");
                                        } catch {
                                            toast.error("Failed to copy Audio URL");
                                        }
                                    } else {
                                        // Fallback for older browsers
                                        const textarea = document.createElement("textarea");
                                        textarea.value = audioUrl;
                                        textarea.style.position = "fixed";
                                        document.body.appendChild(textarea);
                                        textarea.focus();
                                        textarea.select();
                                        try {
                                            const success = document.execCommand("copy");
                                            document.body.removeChild(textarea);
                                            toast[success ? "success" : "error"](
                                                success
                                                    ? "Audio URL copied to clipboard!"
                                                    : "Failed to copy Audio URL",
                                            );
                                        } catch {
                                            document.body.removeChild(textarea);
                                            toast.error("Failed to copy Audio URL");
                                        }
                                    }
                                }}
                                aria-label="Copy audio URL"
                            >
                                <ClipboardCopy className="h-5 w-5" />
                                Copy Audio URL
                            </button>
                        </div>
                        <Dialog.Close asChild>
                            <button
                                className="mt-6 px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 font-semibold dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                                aria-label="Close"
                            >
                                Close
                            </button>
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </motion.div>
    );
};

export default VoiceResponder;
