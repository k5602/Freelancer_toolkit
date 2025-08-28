import axios from 'axios';

const BASE_URL = '/api';

export async function generateProposal(data: {
	job_url?: string;
	job_description?: string;
	user_skills: string[];
	target_rate?: number;
}) {
	try {
		const res = await axios.post(`${BASE_URL}/proposal/generate`, data);
		return res.data;
	} catch (err: unknown) {
		const error = err as { response?: { data?: { detail?: string } }; message?: string };
		throw error.response?.data?.detail || error.message || 'Unknown error';
	}
}

export async function generateContract(data: { proposal: string; client_details: string; }) {
	try {
		const res = await axios.post(`${BASE_URL}/contract/generate`, data);
		return res.data;
	} catch (err: unknown) {
		const error = err as { response?: { data?: { detail?: string } }; message?: string };
		throw error.response?.data?.detail || error.message || 'Unknown error';
	}
}

export async function generateVoice(data: { text_to_speak: string; }) {
	try {
		const res = await axios.post(`${BASE_URL}/voice/generate`, data);
		return res.data;
	} catch (err: unknown) {
		const error = err as { response?: { data?: { detail?: string } }; message?: string };
		throw error.response?.data?.detail || error.message || 'Unknown error';
	}
}
