import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateContract } from "../lib/api";
import { toast } from "react-hot-toast";
import { copyToClipboard } from "../lib/clipboard";
import * as Dialog from "@radix-ui/react-dialog";
import * as Progress from "@radix-ui/react-progress";
import { ClipboardCopy, FileText, Loader2 } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

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
    const [open, setOpen] = React.useState(false);

    const onSubmit = async (data: FormData) => {
        try {
            setContract("");
            setOpen(true);
            const res = await generateContract(data);
            setContract(res.contract_text || res.contract || "");
            toast.success("Contract generated successfully");
            reset();
        } catch (err: any) {
            toast.error(typeof err === "string" ? err : "Failed to generate contract");
            setOpen(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full sm:max-w-xl md:max-w-2xl mx-auto px-2 py-6 bg-white dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow-md"
        >
            <h2 className="text-2xl font-bold mb-4 text-center flex items-center justify-center gap-2">
                <FileText className="inline-block h-6 w-6 text-blue-600" />
                Contract Generator
            </h2>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
                aria-label="Contract Generator Form"
            >
                <label className="font-semibold text-sm" htmlFor="proposal">
                    Proposal
                </label>
                <textarea
                    id="proposal"
                    className={clsx(
                        "w-full h-24 p-2 border rounded resize-y dark:bg-gray-800 dark:border-gray-700",
                        "focus:outline-none focus:ring-2 focus:ring-blue-400",
                    )}
                    placeholder="Paste proposal here..."
                    {...register("proposal")}
                    aria-invalid={!!errors.proposal}
                />
                {errors.proposal && (
                    <p className="text-red-500 text-xs">{errors.proposal.message}</p>
                )}
                <label className="font-semibold text-sm" htmlFor="client_details">
                    Client Details
                </label>
                <textarea
                    id="client_details"
                    className={clsx(
                        "w-full h-24 p-2 border rounded resize-y dark:bg-gray-800 dark:border-gray-700",
                        "focus:outline-none focus:ring-2 focus:ring-blue-400",
                    )}
                    placeholder="Enter client details..."
                    {...register("client_details")}
                    aria-invalid={!!errors.client_details}
                />
                {errors.client_details && (
                    <p className="text-red-500 text-xs">{errors.client_details.message}</p>
                )}
                <button
                    type="submit"
                    className={clsx(
                        "w-full px-4 py-2 mt-2 font-bold text-white bg-blue-500 rounded",
                        "hover:bg-blue-700 transition-colors duration-200 disabled:opacity-60 flex items-center justify-center gap-2",
                        "transition-transform duration-200 hover:scale-105 active:scale-95 shadow hover:shadow-lg",
                    )}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin h-5 w-5" />
                            Generating...
                        </>
                    ) : (
                        "Generate Contract"
                    )}
                </button>
            </form>
            {isSubmitting && (
                <div className="mt-3" aria-live="polite" role="status">
                    <Progress.Root className="relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded h-2" style={{ transform: 'translateZ(0)' }}>
                        <Progress.Indicator className="bg-blue-500 w-1/2 h-full transition-transform" style={{ transform: 'translateX(50%)' }} />
                    </Progress.Root>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Generating contract...</p>
                </div>
            )}
            <Dialog.Root open={open} onOpenChange={setOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
                    <Dialog.Content
                        className={clsx(
                            "fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                            "bg-white dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow-lg p-6 w-full max-w-lg",
                        )}
                        aria-modal="true"
                    >
                        <Dialog.Title className="text-xl font-bold mb-2 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            Generated Contract
                        </Dialog.Title>
                        <Dialog.Description className="mb-4 text-gray-600 dark:text-gray-300">
                            Review and copy your contract below.
                        </Dialog.Description>
                        {contract ? (
                            <pre className="whitespace-pre-line font-mono text-sm break-words bg-gray-50 dark:bg-gray-800 p-3 rounded border dark:border-gray-700 mb-4 max-h-64 overflow-auto">
                                {contract}
                            </pre>
                        ) : (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button
                                className={clsx(
                                    "flex-1 px-4 py-2 font-bold text-white bg-green-500 rounded",
                                    "hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2",
                                    "transition-transform duration-200 hover:scale-105 active:scale-95 shadow hover:shadow-lg",
                                )}
                                onClick={async () => {
                                    const success = await copyToClipboard(contract);
                                    toast[success ? "success" : "error"](
                                        success ? "Copied to clipboard!" : "Failed to copy",
                                    );
                                }}
                                disabled={!contract}
                                aria-label="Copy contract to clipboard"
                            >
                                <ClipboardCopy className="h-5 w-5" />
                                Copy to Clipboard
                            </button>
                            <Dialog.Close asChild>
                                <button
                                    className={clsx(
                                        "flex-1 px-4 py-2 font-bold text-white bg-gray-500 rounded",
                                        "hover:bg-gray-700 transition-colors duration-200",
                                        "transition-transform duration-200 hover:scale-105 active:scale-95 shadow hover:shadow-lg",
                                    )}
                                    aria-label="Close contract dialog"
                                >
                                    Close
                                </button>
                            </Dialog.Close>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </motion.div>
    );
};

export default ContractGenerator;
