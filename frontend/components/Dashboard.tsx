import React, { useState } from "react";
import ProposalGenerator from "./ProposalGenerator";
import VoiceResponder from "./VoiceResponder";
import ContractGenerator from "./ContractGenerator";

type Tool = "proposal" | "voice" | "contract";

const Dashboard: React.FC = () => {
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

    const renderTool = () => {
        switch (selectedTool) {
            case "proposal":
                return <ProposalGenerator />;
            case "voice":
                return <VoiceResponder />;
            case "contract":
                return <ContractGenerator />;
            default:
                return (
                    <div>
                        <h1 className="text-3xl font-bold">Welcome to the Dashboard</h1>
                        <p className="mt-4">Select a tool from the sidebar to get started.</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen">
            <div className="w-64 bg-gray-800 text-white">
                <div className="p-4 text-2xl font-bold">Freelancer Toolkit</div>
                <nav className="mt-10">
                    <a
                        href="#"
                        onClick={() => setSelectedTool("proposal")}
                        className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
                    >
                        Proposal Generator
                    </a>
                    <a
                        href="#"
                        onClick={() => setSelectedTool("voice")}
                        className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
                    >
                        Voice Responder
                    </a>
                    <a
                        href="#"
                        onClick={() => setSelectedTool("contract")}
                        className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
                    >
                        Contract Generator
                    </a>
                </nav>
            </div>
            <div className="flex-1 p-10">{renderTool()}</div>
        </div>
    );
};

export default Dashboard;
