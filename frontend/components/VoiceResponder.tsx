import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateVoice } from "../lib/api";
import { toast } from "react-hot-toast";
import useSound from "use-sound";

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
    const [play, { stop }] = useSound(audioUrl, { soundEnabled: !!audioUrl });

    const onSubmit = async (data: FormData) => {
        try {
            const res = await generateVoice(data);
            setAudioUrl(res.audio_url || res.audioUrl || "");
            toast.success("Audio generated successfully");
            reset();
        } catch (err: unknown) {
            const error = err as string | { message?: string };
            toast.error(typeof error === "string" ? error : error.message || "Failed to generate audio");
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold">Voice Responder</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                <textarea
                    className="w-full h-20 p-2 border rounded"
                    placeholder="Enter text to speak..."
                    {...register("text_to_speak")}
                />
                {errors.text_to_speak && (
                    <p className="text-red-500">{errors.text_to_speak.message}</p>
                )}
                <button
                    type="submit"
                    className="px-4 py-2 mt-4 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Generating..." : "Generate Voice"}
                </button>
            </form>
            {audioUrl && (
                <div className="p-4 mt-4 border rounded bg-gray-100">
                    <h3 className="text-xl font-bold">Generated Audio:</h3>
                    <audio controls src={audioUrl} className="mt-2" />
                    <button
                        className="px-4 py-2 mt-2 font-bold text-white bg-green-500 rounded hover:bg-green-700"
                        onClick={() => play()}
                    >
                        Play
                    </button>
                    <button
                        className="px-4 py-2 mt-2 ml-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
                        onClick={() => stop()}
                    >
                        Stop
                    </button>
                    <button
                        className="px-4 py-2 mt-2 ml-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
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
                    >
                        Copy Audio URL
                    </button>
                </div>
            )}
        </div>
    );
};

export default VoiceResponder;
