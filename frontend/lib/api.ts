import { http } from './http';

export async function generateProposal(data: {
    job_url?: string;
    job_description?: string;
    user_skills: string[];
    target_rate?: number;
}) {
    try {
        const res = await http.post(`/proposal/generate`, data);
        return res.data;
    } catch (err: any) {
        // http interceptor already formats as { status, message }
        throw err;
    }
}

export async function generateContract(data: { proposal: string; client_details: string; }) {
    try {
        const res = await http.post(`/contract/generate`, data);
        return res.data;
    } catch (err: any) {
        throw err;
    }
}

export async function generateVoice(data: { text_to_speak: string; }) {
    try {
        const res = await http.post(`/voice/generate`, data);
        return res.data;
    } catch (err: any) {
        throw err;
    }
}
