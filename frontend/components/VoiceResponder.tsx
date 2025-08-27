import React, { useState } from "react";
import axios from "axios";

const VoiceResponder: React.FC = () => {
    const [textToSpeak, setTextToSpeak] = useState("");
    const [audioUrl, setAudioUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const generateVoice = async () => {
        setLoading(true);
        try {
            const response = await axios.post("http://localhost:8000/api/voice/generate", {
                text_to_speak: textToSpeak,
            });
            setAudioUrl(response.data.audio_url);
        } catch (error) {
            console.error("Error generating voice:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold">Voice Responder</h2>
            <textarea
                className="w-full h-40 p-2 mt-4 border rounded"
                placeholder="Enter the text to speak here..."
                value={textToSpeak}
                onChange={(e) => setTextToSpeak(e.target.value)}
            />
            <button
                className="px-4 py-2 mt-4 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
                onClick={generateVoice}
                disabled={loading}
            >
                {loading ? "Generating..." : "Generate Voice"}
            </button>
            {audioUrl && (
                <div className="p-4 mt-4 border rounded bg-gray-100">
                    <h3 className="text-xl font-bold">Generated Audio:</h3>
                    <audio controls src={audioUrl} className="mt-2" />
                </div>
            )}
        </div>
    );
};

export default VoiceResponder;
