import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateContract } from "../lib/api";
import { toast } from "react-hot-toast";
import { copyToClipboard } from "../lib/clipboard";
import * as Dialog from "@radix-ui/react-dialog";
import * as Progress from "@radix-ui/react-progress";
import {
    ClipboardCopy,
    FileText,
    Loader2,
    ShieldCheck,
    AlertTriangle,
    AlertOctagon,
} from "lucide-react";
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
    const [viewMode, setViewMode] = React.useState<"markdown" | "raw">("markdown");
    const [riskScore, setRiskScore] = React.useState<number | null>(null);
    const [riskLevel, setRiskLevel] = React.useState<string | null>(null);
    const [riskFlags, setRiskFlags] = React.useState<string[]>([]);
    const [recommendations, setRecommendations] = React.useState<string[]>([]);

    const getRiskUI = React.useCallback((score: number | null, level: string | null) => {
        const s = typeof score === "number" ? score : null;
        let lvl = level ? level.toLowerCase() : null;
        if (!lvl && s !== null) {
            if (s <= 30) lvl = "low";
            else if (s <= 70) lvl = "medium";
            else lvl = "high";
        }
        const color =
            lvl === "high"
                ? "bg-red-500"
                : lvl === "medium"
                  ? "bg-yellow-500"
                  : lvl === "low"
                    ? "bg-green-500"
                    : "bg-gray-400";
        const Icon =
            lvl === "high"
                ? AlertOctagon
                : lvl === "medium"
                  ? AlertTriangle
                  : lvl === "low"
                    ? ShieldCheck
                    : null;
        const label = (lvl || "N/A").toUpperCase();
        return { color, Icon, label };
    }, []);

    const sanitizeContractToMarkdown = React.useCallback((input: string): string => {
        if (!input) return "";
        try {
            const trimmed = input.trim();
            if (trimmed.startsWith("{")) {
                const data = JSON.parse(trimmed);
                if (typeof data === "object" && data) {
                    if (
                        typeof (data as any).contract_text === "string" &&
                        (data as any).contract_text.trim()
                    ) {
                        return (data as any).contract_text.trim();
                    }
                    if (
                        typeof (data as any).proposal_text === "string" &&
                        (data as any).proposal_text.trim()
                    ) {
                        const ps = (data as any).pricing_strategy
                            ? `\n\n## Pricing Strategy\n${(data as any).pricing_strategy}`
                            : "";
                        const tl = (data as any).estimated_timeline
                            ? `\n\n## Estimated Timeline\n${(data as any).estimated_timeline}`
                            : "";
                        const tips =
                            Array.isArray((data as any).success_tips) &&
                            (data as any).success_tips.length
                                ? `\n\n## Success Tips\n${(data as any).success_tips.map((t: any) => `- ${String(t)}`).join("\n")}`
                                : "";
                        return `# Proposal\n\n${(data as any).proposal_text}${ps}${tl}${tips}`.trim();
                    }
                }
            }
        } catch {}
        return input;
    }, []);

    const basicMarkdownToHtml = React.useCallback((md: string): string => {
        if (!md) return "";
        const esc = (s: string) =>
            s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const lines = md.split(/\r?\n/);
        let html = "";
        let inUl = false;
        let inOl = false;
        const closeLists = () => {
            if (inUl) {
                html += "</ul>";
                inUl = false;
            }
            if (inOl) {
                html += "</ol>";
                inOl = false;
            }
        };
        for (const raw of lines) {
            const line = raw;
            const h = line.match(/^(#{1,6})\s+(.*)$/);
            if (h) {
                closeLists();
                const level = h[1].length;
                html += `<h${level}>${esc(h[2])}</h${level}>`;
                continue;
            }
            if (/^\s*[-*]\s+/.test(line)) {
                if (!inUl) {
                    closeLists();
                    html += "<ul>";
                    inUl = true;
                }
                html += `<li>${esc(line.replace(/^\s*[-*]\s+/, ""))}</li>`;
                continue;
            }
            if (/^\s*\d+\.\s+/.test(line)) {
                if (!inOl) {
                    closeLists();
                    html += "<ol>";
                    inOl = true;
                }
                html += `<li>${esc(line.replace(/^\s*\d+\.\s+/, ""))}</li>`;
                continue;
            }
            if (line.trim() === "") {
                closeLists();
                html += "<br/>";
                continue;
            }
            closeLists();
            html += `<p>${esc(line)}</p>`;
        }
        closeLists();
        return html;
    }, []);

    const markdown = React.useMemo(
        () => sanitizeContractToMarkdown(contract),
        [contract, sanitizeContractToMarkdown],
    );
    const renderedHtml = React.useMemo(
        () => basicMarkdownToHtml(markdown),
        [markdown, basicMarkdownToHtml],
    );

    const onSubmit = async (data: FormData) => {
        try {
            setContract("");
            setOpen(true);
            const res = await generateContract(data);
            setContract(res.contract_text || res.contract || "");
            setRiskScore(typeof res.risk_score === "number" ? res.risk_score : null);
            setRiskLevel(typeof res.risk_level === "string" ? res.risk_level : null);
            setRiskFlags(Array.isArray(res.risk_flags) ? res.risk_flags : []);
            setRecommendations(Array.isArray(res.recommendations) ? res.recommendations : []);
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
                    <Progress.Root
                        className="relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded h-2"
                        style={{ transform: "translateZ(0)" }}
                    >
                        <Progress.Indicator
                            className="bg-blue-500 w-1/2 h-full transition-transform"
                            style={{ transform: "translateX(50%)" }}
                        />
                    </Progress.Root>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Generating contract...
                    </p>
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
                            <>
                                <div className="mb-3 flex gap-2">
                                    <button
                                        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                        onClick={() => setViewMode("markdown")}
                                        aria-pressed={viewMode === "markdown"}
                                    >
                                        Preview
                                    </button>
                                    <button
                                        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                        onClick={() => setViewMode("raw")}
                                        aria-pressed={viewMode === "raw"}
                                    >
                                        Raw
                                    </button>
                                </div>
                                {viewMode === "markdown" ? (
                                    <div
                                        className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800 p-3 rounded border dark:border-gray-700 mb-4 max-h-64 overflow-auto"
                                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                                    />
                                ) : (
                                    <pre className="whitespace-pre-line font-mono text-sm break-words bg-gray-50 dark:bg-gray-800 p-3 rounded border dark:border-gray-700 mb-4 max-h-64 overflow-auto">
                                        {contract}
                                    </pre>
                                )}

                                {(riskScore !== null ||
                                    (riskLevel ?? "") ||
                                    riskFlags.length > 0 ||
                                    recommendations.length > 0) && (
                                    <div className="mt-3 bg-gray-50 dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <strong>Risk Analysis</strong>
                                            {(() => {
                                                const ui = getRiskUI(riskScore, riskLevel);
                                                const Icon = ui.Icon;
                                                return (
                                                    <span
                                                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded text-white ${ui.color}`}
                                                    >
                                                        {Icon ? <Icon className="w-4 h-4" /> : null}
                                                        {ui.label}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <div className="text-sm mb-2">
                                            <span className="font-semibold">Risk Score:</span>{" "}
                                            {riskScore ?? "N/A"}/100
                                        </div>
                                        {riskFlags.length > 0 && (
                                            <div className="text-sm mb-2">
                                                <div className="font-semibold mb-1">
                                                    Detected Flags
                                                </div>
                                                <ul className="list-disc ml-5">
                                                    {riskFlags.map((f, i) => (
                                                        <li key={i}>{f}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {recommendations.length > 0 && (
                                            <div className="text-sm">
                                                <div className="font-semibold mb-1">
                                                    Recommendations
                                                </div>
                                                <ul className="list-disc ml-5">
                                                    {recommendations.map((r, i) => (
                                                        <li key={i}>{r}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                className={clsx(
                                    "flex-1 px-4 py-2 font-bold text-white bg-green-500 rounded",
                                    "hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2",
                                    "transition-transform duration-200 hover:scale-105 active:scale-95 shadow hover:shadow-lg",
                                )}
                                onClick={async () => {
                                    const success = await copyToClipboard(markdown);
                                    toast[success ? "success" : "error"](
                                        success ? "Copied to clipboard!" : "Failed to copy",
                                    );
                                }}
                                disabled={!markdown}
                                aria-label="Copy contract (Markdown) to clipboard"
                            >
                                <ClipboardCopy className="h-5 w-5" />
                                Copy Markdown
                            </button>
                            <button
                                className={clsx(
                                    "flex-1 px-4 py-2 font-bold text-white bg-blue-500 rounded",
                                    "hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2",
                                    "transition-transform duration-200 hover:scale-105 active:scale-95 shadow hover:shadow-lg",
                                )}
                                onClick={() => {
                                    const name = `contract-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.md`;
                                    const blob = new Blob([markdown], {
                                        type: "text/markdown;charset=utf-8",
                                    });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = name;
                                    document.body.appendChild(a);
                                    a.click();
                                    setTimeout(() => {
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                    }, 0);
                                }}
                                disabled={!markdown}
                                aria-label="Download contract as Markdown"
                            >
                                Download .md
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
