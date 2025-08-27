import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateProposal } from "../lib/api";
import { toast } from "react-hot-toast";
import { copyToClipboard } from "../lib/clipboard";


const schema = z.object({
    job_url: z.string().url("Invalid URL").optional(),
    job_description: z.string().min(10, "Job description must be at least 10 characters").optional(),
    user_skills: z.string().min(2, "Enter at least one skill"),
    target_rate: z.number().min(1, "Rate must be positive").optional(),
});

type FormData = z.infer<typeof schema>;

const ProposalGenerator: React.FC = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormData>({ resolver: zodResolver(schema) });
    const [response, setResponse] = React.useState<null | {
        proposal_text: string;
        pricing_strategy: string;
        estimated_timeline: string;
        success_tips: string[];
    }>(null);


    const onSubmit = async (data: FormData) => {
        try {
            const payload = {
                job_url: data.job_url || undefined,
                job_description: data.job_description || undefined,
                user_skills: data.user_skills.split(",").map(s => s.trim()).filter(Boolean),
                target_rate: data.target_rate || undefined,
            };
            const res = await generateProposal(payload);
            setResponse(res);
            toast.success("Proposal generated successfully");
        } catch (err: any) {
            toast.error(typeof err === "string" ? err : "Failed to generate proposal");
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold">Proposal Generator</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                <input
                    className="w-full p-2 border rounded"
                    placeholder="Job posting URL (optional)"
                    {...register("job_url")}
                />
                {errors.job_url && <p className="text-red-500">{errors.job_url.message}</p>}
                <textarea
                    className="w-full h-20 p-2 mt-2 border rounded"
                    placeholder="Job description (optional if URL provided)"
                    {...register("job_description")}
                />
                {errors.job_description && <p className="text-red-500">{errors.job_description.message}</p>}
                <input
                    className="w-full p-2 mt-2 border rounded"
                    placeholder="Your skills (comma separated)"
                    {...register("user_skills")}
                />
                {errors.user_skills && <p className="text-red-500">{errors.user_skills.message}</p>}
                <input
                    className="w-full p-2 mt-2 border rounded"
                    type="number"
                    step="0.01"
                    placeholder="Target hourly rate (optional)"
                    {...register("target_rate", { valueAsNumber: true })}
                />
                {errors.target_rate && <p className="text-red-500">{errors.target_rate.message}</p>}
                <button
                    type="submit"
                    className="px-4 py-2 mt-4 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Generating..." : "Generate Proposal"}
                </button>
            </form>
            {response && (
                <div className="p-4 mt-4 border rounded bg-gray-100">
                    <h3 className="text-xl font-bold">Generated Proposal:</h3>
                    <p className="mt-2 whitespace-pre-line font-mono">{response.proposal_text}</p>
                    <div className="mt-2">
                        <strong>Pricing Strategy:</strong> {response.pricing_strategy}
                    </div>
                    <div className="mt-2">
                        <strong>Estimated Timeline:</strong> {response.estimated_timeline}
                    </div>
                    <div className="mt-2">
                        <strong>Success Tips:</strong>
                        <ul className="list-disc ml-6">
                            {response.success_tips.map((tip, i) => (
                                <li key={i}>{tip}</li>
                            ))}
                        </ul>
                    </div>
                    <button
                        className="px-4 py-2 mt-2 font-bold text-white bg-green-500 rounded hover:bg-green-700"
                        onClick={async () => {
                            const success = await copyToClipboard(response.proposal_text);
                            toast[success ? "success" : "error"](
                                success ? "Copied to clipboard!" : "Failed to copy",
                            );
                        }}
                    >
                        Copy Proposal to Clipboard
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProposalGenerator;
