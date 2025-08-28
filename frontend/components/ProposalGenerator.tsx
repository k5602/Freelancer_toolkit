
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateProposal } from "../lib/api";
import { toast } from "react-hot-toast";
import { copyToClipboard } from "../lib/clipboard";
import * as Dialog from "@radix-ui/react-dialog";
import * as Progress from "@radix-ui/react-progress";
import * as Tabs from "@radix-ui/react-tabs";
import { ClipboardCopy, Loader2, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

const schema = z.object({
    job_url: z.string().url("Invalid URL").optional(),
    job_description: z
        .string()
        .min(10, "Job description must be at least 10 characters")
        .optional(),
    user_skills: z.string().min(2, "Enter at least one skill"),
    target_rate: z.number().min(1, "Rate must be positive").optional(),
});

type FormData = z.infer<typeof schema>;

const ProposalGenerator: React.FC = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        reset,
    } = useForm<FormData>({ resolver: zodResolver(schema) });
    const [mode, setMode] = React.useState<"url" | "manual">("url");
    const [response, setResponse] = React.useState<null | {
        proposal_text: string;
        pricing_strategy: string;
        estimated_timeline: string;
        success_tips: string[];
    }>(null);
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

    // Persist form + mode in localStorage
    const LS_KEY = "proposal_form_v1";
    React.useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) {
                const saved = JSON.parse(raw) as { mode?: "url" | "manual"; form?: Partial<FormData> };
                if (saved?.mode) setMode(saved.mode);
                if (saved?.form) {
                    reset(saved.form as any);
                }
            }
        } catch {}
        // run once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formValues = watch();
    React.useEffect(() => {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify({ mode, form: formValues }));
        } catch {}
    }, [mode, formValues]);

    const onSubmit = async (data: FormData) => {
        try {
            setErrorMsg(null);
            // Mode-aware validation
            if (mode === "url" && !data.job_url) {
                toast.error("Please provide a job URL or switch to Manual tab.");
                return;
            }
            if (mode === "manual" && (!data.job_description || data.job_description.trim().length < 10)) {
                toast.error("Please provide a job description of at least 10 characters.");
                return;
            }
            const payload = {
                job_url: data.job_url || undefined,
                job_description: data.job_description || undefined,
                user_skills: data.user_skills
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                target_rate: data.target_rate || undefined,
            };
            const res = await generateProposal(payload);
            setResponse(res);
            toast.success("Proposal generated successfully");
        } catch (err: any) {
            if (err?.status === 400) {
                const msg = err?.message || "Add job description or a valid URL.";
                setErrorMsg(msg);
                toast.error(msg);
            } else {
                const msg = err?.message || "Failed to generate proposal";
                setErrorMsg(msg);
                toast.error(msg);
            }
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full sm:max-w-xl md:max-w-2xl mx-auto px-2 py-6 bg-white dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow-md transition-colors duration-300"
        >
            <h2 className="text-2xl font-bold mb-2 text-center">Proposal Generator</h2>
            {errorMsg && (
                <div
                    className="mb-3 p-3 rounded border border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                    role="alert"
                >
                    {errorMsg}
                </div>
            )}
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-4 flex flex-col gap-3"
                aria-label="Proposal Form"
            >
                <Tabs.Root value={mode} onValueChange={(v) => setMode(v as any)}>
                    <Tabs.List className="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden self-center">
                        <Tabs.Trigger value="url" className={clsx("px-4 py-2 text-sm", mode === 'url' ? "bg-blue-600 text-white" : "bg-transparent text-gray-700 dark:text-gray-300")}>URL</Tabs.Trigger>
                        <Tabs.Trigger value="manual" className={clsx("px-4 py-2 text-sm", mode === 'manual' ? "bg-blue-600 text-white" : "bg-transparent text-gray-700 dark:text-gray-300")}>Manual</Tabs.Trigger>
                    </Tabs.List>

                    <Tabs.Content value="url" className="mt-3">
                        <label htmlFor="job_url" className="text-sm font-medium">Job posting URL</label>
                        <input
                            id="job_url"
                            className={clsx(
                                "w-full p-2 border rounded focus:outline-none transition dark:bg-gray-800 dark:border-gray-700",
                                errors.job_url ? "border-red-500" : "focus:ring-2 focus:ring-blue-400",
                            )}
                            placeholder="https://..."
                            {...register("job_url")}
                            aria-invalid={!!errors.job_url}
                            aria-describedby="job_url_help"
                        />
                        {errors.job_url && <p className="text-red-500 text-sm">{errors.job_url.message}</p>}
                        <p id="job_url_help" className="text-xs text-gray-500 -mt-1">We’ll fetch details from the job page.</p>
                    </Tabs.Content>

                    <Tabs.Content value="manual" className="mt-3">
                        <label htmlFor="job_description" className="text-sm font-medium">Job description</label>
                        <textarea
                            id="job_description"
                            className={clsx(
                                "w-full h-24 p-2 border rounded focus:outline-none transition dark:bg-gray-800 dark:border-gray-700",
                                errors.job_description
                                    ? "border-red-500"
                                    : "focus:ring-2 focus:ring-blue-400",
                            )}
                            placeholder="Paste or write a short job description..."
                            {...register("job_description")}
                            aria-invalid={!!errors.job_description}
                        />
                        {errors.job_description && (
                            <p className="text-red-500 text-sm">{errors.job_description.message}</p>
                        )}
                    </Tabs.Content>
                </Tabs.Root>

                <label htmlFor="user_skills" className="text-sm font-medium">Your skills</label>
                <input
                    id="user_skills"
                    className={clsx(
                        "w-full p-2 border rounded focus:outline-none transition dark:bg-gray-800 dark:border-gray-700",
                        errors.user_skills ? "border-red-500" : "focus:ring-2 focus:ring-blue-400",
                    )}
                    placeholder="e.g. React, Tailwind, FastAPI"
                    {...register("user_skills")}
                    aria-invalid={!!errors.user_skills}
                />
                {errors.user_skills && (
                    <p className="text-red-500 text-sm">{errors.user_skills.message}</p>
                )}
                <label htmlFor="target_rate" className="text-sm font-medium">Target hourly rate <span className="text-gray-500">(optional)</span></label>
                <input
                    id="target_rate"
                    className={clsx(
                        "w-full p-2 border rounded focus:outline-none transition dark:bg-gray-800 dark:border-gray-700",
                        errors.target_rate ? "border-red-500" : "focus:ring-2 focus:ring-blue-400",
                    )}
                    type="number"
                    step="0.01"
                    placeholder="e.g. 45"
                    {...register("target_rate", { valueAsNumber: true })}
                    aria-invalid={!!errors.target_rate}
                />
                {errors.target_rate && (
                    <p className="text-red-500 text-sm">{errors.target_rate.message}</p>
                )}
                <button
                    type="submit"
                    className={clsx(
                        "w-full px-4 py-2 font-bold text-white rounded transition disabled:opacity-60 flex items-center justify-center gap-2",
                        "hover:scale-105 active:scale-95 shadow hover:shadow-lg",
                        isSubmitting ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-700",
                    )}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2
                                className="animate-spin h-5 w-5 text-white"
                                aria-label="Loading"
                            />
                            Generating...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-5 w-5 text-white" aria-hidden="true" />
                            Generate Proposal
                        </>
                    )}
                </button>
            </form>
            {isSubmitting && (
                <div className="mt-3" aria-live="polite" role="status">
                    <Progress.Root
                        className="relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded h-2"
                        style={{ transform: 'translateZ(0)' }}
                    >
                        <Progress.Indicator
                            className="bg-blue-500 w-1/2 h-full transition-transform"
                            style={{ transform: 'translateX(50%)' }}
                        />
                    </Progress.Root>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Generating proposal...</p>
                </div>
            )}
            <Dialog.Root open={!!response} onOpenChange={(v) => { if (!v) setResponse(null); }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
                    <Dialog.Content
                        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-lg max-w-lg w-full p-6"
                        aria-modal="true"
                        aria-label="Generated Proposal"
                    >
                        {response && (
                            <>
                                <Dialog.Title className="text-xl font-bold mb-2">
                                    Generated Proposal
                                </Dialog.Title>
                                {/* Proposal Text */}
                                <div className="mt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">Proposal</span>
                                        <button
                                            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                            onClick={async () => {
                                                const ok = await copyToClipboard(response.proposal_text);
                                                toast[ok ? "success" : "error"](ok ? "Copied" : "Copy failed");
                                            }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <p className="mt-1 whitespace-pre-line font-mono text-sm break-words">
                                        {response.proposal_text}
                                    </p>
                                </div>

                                {/* Pricing Strategy */}
                                <div className="mt-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <strong>Pricing Strategy</strong>
                                        <button
                                            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                            onClick={async () => {
                                                const ok = await copyToClipboard(response.pricing_strategy);
                                                toast[ok ? "success" : "error"](ok ? "Copied" : "Copy failed");
                                            }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <div className="mt-1">{response.pricing_strategy}</div>
                                </div>

                                {/* Estimated Timeline */}
                                <div className="mt-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <strong>Estimated Timeline</strong>
                                        <button
                                            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                            onClick={async () => {
                                                const ok = await copyToClipboard(response.estimated_timeline);
                                                toast[ok ? "success" : "error"](ok ? "Copied" : "Copy failed");
                                            }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <div className="mt-1">{response.estimated_timeline}</div>
                                </div>

                                {/* Success Tips */}
                                <div className="mt-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <strong>Success Tips</strong>
                                        <button
                                            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                            onClick={async () => {
                                                const text = response.success_tips.join("\n");
                                                const ok = await copyToClipboard(text);
                                                toast[ok ? "success" : "error"](ok ? "Copied" : "Copy failed");
                                            }}
                                        >
                                            Copy All
                                        </button>
                                    </div>
                                    <ul className="list-disc ml-6 mt-1">
                                        {response.success_tips.map((tip, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="flex-1">{tip}</span>
                                                <button
                                                    className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                                    onClick={async () => {
                                                        const ok = await copyToClipboard(tip);
                                                        toast[ok ? "success" : "error"](ok ? "Copied" : "Copy failed");
                                                    }}
                                                >
                                                    Copy
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button
                                    className="w-full px-4 py-2 mt-4 font-bold text-white bg-green-500 rounded hover:bg-green-700 transition flex items-center justify-center gap-2 hover:scale-105 active:scale-95 shadow hover:shadow-lg"
                                    onClick={async () => {
                                        const success = await copyToClipboard(
                                            response.proposal_text,
                                        );
                                        toast[success ? "success" : "error"](
                                            success ? "Copied to clipboard!" : "Failed to copy",
                                        );
                                    }}
                                    aria-label="Copy Proposal to Clipboard"
                                >
                                    <ClipboardCopy className="h-5 w-5 mr-2" />
                                    Copy Proposal to Clipboard
                                </button>
                                <Dialog.Close asChild>
                                    <button
                                        className="w-full px-4 py-2 mt-2 font-bold text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition hover:scale-105 active:scale-95 shadow hover:shadow-lg dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
                                        aria-label="Close"
                                    >
                                        Close
                                    </button>
                                </Dialog.Close>
                            </>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </motion.div>
    );
};

export default ProposalGenerator;
