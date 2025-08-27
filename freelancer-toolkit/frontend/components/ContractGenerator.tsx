import React, { useState } from "react";
import axios from "axios";

const ContractGenerator: React.FC = () => {
    const [projectDescription, setProjectDescription] = useState("");
    const [contract, setContract] = useState("");
    const [loading, setLoading] = useState(false);

    const generateContract = async () => {
        setLoading(true);
        try {
            const response = await axios.post("http://localhost:8000/api/contract/generate", {
                project_description: projectDescription,
            });
            setContract(response.data.contract_text);
        } catch (error) {
            console.error("Error generating contract:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold">Contract Generator</h2>
            <textarea
                className="w-full h-40 p-2 mt-4 border rounded"
                placeholder="Enter the project description here..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
            />
            <button
                className="px-4 py-2 mt-4 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
                onClick={generateContract}
                disabled={loading}
            >
                {loading ? "Generating..." : "Generate Contract"}
            </button>
            {contract && (
                <div className="p-4 mt-4 border rounded bg-gray-100">
                    <h3 className="text-xl font-bold">Generated Contract:</h3>
                    <p className="mt-2">{contract}</p>
                </div>
            )}
        </div>
    );
};

export default ContractGenerator;
