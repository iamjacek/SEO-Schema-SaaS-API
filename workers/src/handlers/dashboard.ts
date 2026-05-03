// src/handlers/dashboard.ts

import { getDashboardHTML } from '../lib/dashboard';

export async function handleGetDashboard(): Promise<Response> {
	return new Response(getDashboardHTML(), {
		headers: { 'Content-Type': 'text/html' },
		status: 200,
	});
}
