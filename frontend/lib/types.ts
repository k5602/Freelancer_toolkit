export interface ProposalResponse {
    proposal_text: string;
    pricing_strategy: string;
    estimated_timeline: string;
    success_tips: string[];
}

export interface VoiceResponse {
    audio_url: string;
    audioUrl?: string; // Alternative field name for compatibility
}

export interface ContractResponse {
    contract_text?: string;
    contract?: string; // Alternative field name for compatibility
}

export interface ApiError {
    detail: string;
}
