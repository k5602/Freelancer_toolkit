import axios from 'axios';

const BASE_URL = '/api';
export async function generateProposal(data: { job_description: string; client_requirements: string; }) {
	try {
		const res = await axios.post(`${BASE_URL}/proposal/generate`, data);
		return res.data;
	} catch (err: any) {
		throw err.response?.data?.detail || err.message;
	}
}

export async function generateContract(data: { proposal: string; client_details: string; }) {
	try {
		const res = await axios.post(`${BASE_URL}/contract/generate`, data);
		return res.data;
	} catch (err: any) {
		throw err.response?.data?.detail || err.message;
	}
}

export async function generateVoice(data: { text_to_speak: string; }) {
	try {
		const res = await axios.post(`${BASE_URL}/voice/generate`, data);
		return res.data;
	} catch (err: any) {
		throw err.response?.data?.detail || err.message;
	}
}
