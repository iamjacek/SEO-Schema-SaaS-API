// src/lib/db.ts
import { neon } from '@neondatabase/serverless';

export interface Env {
	DATABASE_URL: string;
	OPENAI_API_KEY: string;
}

export function getSql(env: Env) {
	if (!env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set');
	}
	return neon(env.DATABASE_URL);
}
