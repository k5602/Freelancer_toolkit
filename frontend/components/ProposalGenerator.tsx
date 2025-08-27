import React, { useState } from "react";
import axios from "axios";

const ProposalGenerator: React.FC = () => {
    const [jobDescription, setJobDescription] = useState("");
    const [proposal, setProposal] = useState("");
    const [loading, setLoading] = useState(false);

    const generateProposal = async () => {
        setLoading(true);
        try {
            const response = await axios.post("http://localhost:8000/api/proposal/generate", {
                job_description: jobDescription,
            });
            setProposal(response.data.proposal_text);
        } catch (error) {
            console.error("Error generating proposal:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold">Proposal Generator</h2>
            <textarea
                className="w-full h-40 p-2 mt-4 border rounded"
                placeholder="Enter the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
            />
            <button
                className="px-4 py-2 mt-4 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
                onClick={generateProposal}
                disabled={loading}
            >
                {loading ? "Generating..." : "Generate Proposal"}
            </button>
            {proposal && (
                <div className="p-4 mt-4 border rounded bg-gray-100">
                    <h3 className="text-xl font-bold">Generated Proposal:</h3>
                    <p className="mt-2">{proposal}</p>
                </div>
            )}
        </div>
    );
};

export default ProposalGenerator;
