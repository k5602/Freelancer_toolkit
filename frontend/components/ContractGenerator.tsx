import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateContract } from "../lib/api";
import { toast } from "react-hot-toast";
import { copyToClipboard } from "../lib/clipboard";

const schema = z.object({
    proposal: z.string().min(10, "Proposal must be at least 10 characters"),
    client_details: z.string().min(10, "Client details must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

const ContractGenerator: React.FC = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormData>({ resolver: zodResolver(schema) });
    const [contract, setContract] = React.useState("");

    const onSubmit = async (data: FormData) => {
        try {
            const res = await generateContract(data);
            setContract(res.contract_text || res.contract || "");
            toast.success("Contract generated successfully");
            reset();
        } catch (err: unknown) {
            const error = err as string | { message?: string };
            toast.error(typeof error === "string" ? error : error.message || "Failed to generate contract");
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold">Contract Generator</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                <textarea
                    className="w-full h-20 p-2 border rounded"
                    placeholder="Paste proposal here..."
                    {...register("proposal")}
                />
                {errors.proposal && <p className="text-red-500">{errors.proposal.message}</p>}
                <textarea
                    className="w-full h-20 p-2 mt-2 border rounded"
                    placeholder="Enter client details..."
                    {...register("client_details")}
                />
                {errors.client_details && (
                    <p className="text-red-500">{errors.client_details.message}</p>
                )}
                <button
                    type="submit"
                    className="px-4 py-2 mt-4 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Generating..." : "Generate Contract"}
                </button>
            </form>
            {contract && (
                <div className="p-4 mt-4 border rounded bg-gray-100">
                    <h3 className="text-xl font-bold">Generated Contract:</h3>
                    <p className="mt-2 whitespace-pre-line">{contract}</p>
                    <button
                        className="px-4 py-2 mt-2 font-bold text-white bg-green-500 rounded hover:bg-green-700"
                        onClick={async () => {
                            const success = await copyToClipboard(contract);
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

export default ContractGenerator;
