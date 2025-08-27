import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateProposal } from "../lib/api";
import { toast } from "react-hot-toast";
import { copyToClipboard } from "../lib/clipboard";

const schema = z.object({
    job_description: z.string().min(10, "Job description must be at least 10 characters"),
    client_requirements: z.string().min(10, "Client requirements must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

const ProposalGenerator: React.FC = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormData>({ resolver: zodResolver(schema) });
    const [proposal, setProposal] = React.useState("");

    const onSubmit = async (data: FormData) => {
        try {
            const res = await generateProposal(data);
            setProposal(res.proposal_text || res.proposal || "");
            toast.success("Proposal generated successfully");
            reset();
        } catch (err: any) {
            toast.error(typeof err === "string" ? err : "Failed to generate proposal");
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold">Proposal Generator</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                <textarea
                    className="w-full h-20 p-2 border rounded"
                    placeholder="Enter job description..."
                    {...register("job_description")}
                />
                {errors.job_description && (
                    <p className="text-red-500">{errors.job_description.message}</p>
                )}
                <textarea
                    className="w-full h-20 p-2 mt-2 border rounded"
                    placeholder="Enter client requirements..."
                    {...register("client_requirements")}
                />
                {errors.client_requirements && (
                    <p className="text-red-500">{errors.client_requirements.message}</p>
                )}
                <button
                    type="submit"
                    className="px-4 py-2 mt-4 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Generating..." : "Generate Proposal"}
                </button>
            </form>
            {proposal && (
                <div className="p-4 mt-4 border rounded bg-gray-100">
                    <h3 className="text-xl font-bold">Generated Proposal:</h3>
                    <p className="mt-2 whitespace-pre-line">{proposal}</p>
                    <button
                        className="px-4 py-2 mt-2 font-bold text-white bg-green-500 rounded hover:bg-green-700"
                        onClick={async () => {
                            const success = await copyToClipboard(proposal);
                            toast[success ? "success" : "error"](
                                success ? "Copied to clipboard!" : "Failed to copy",
                            );
                        }}
                    >
                        Copy to Clipboard
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProposalGenerator;
