// src/lib/storage.ts

import { getSql } from './db';
import type { Env as DbEnv } from './db';
import type { GenerateSeoSchemaResult, GenerateSeoSchemaInput } from './ai';

export type InsertGenerationInput = {
	userId: string;
	planId: string;
	input: GenerateSeoSchemaInput;
	output: GenerateSeoSchemaResult;
	tokens: {
		input: number;
		output: number;
	};
};

export type InsertGenerationError = {
	userId: string;
	planId: string;
	input: GenerateSeoSchemaInput;
	error: string;
	tokens: {
		input: number;
		output: number;
	};
};

/**
 * Save successful generation to database
 */
export async function insertGeneration(data: InsertGenerationInput, env: DbEnv): Promise<{ id: string }> {
	const sql = getSql(env);

	const result = await sql`
    INSERT INTO generations (
      user_id,
      plan_id,
      content_type,
      language,
      tone,
      target_keyword,
      site_name,
      brand_voice,
      input_title,
      input_brief,
      meta_title,
      meta_description,
      slug,
      url,
      og_tags,
      schema_jsonld,
      twitter_tags,
      provider,
      model,
      tokens_input,
      tokens_output,
      status,
      created_at
    )
    VALUES (
      ${data.userId},
      ${data.planId},
      ${data.input.contentType},
      ${data.input.language},
      ${data.input.tone},
      ${data.input.targetKeyword},
      ${data.input.siteName},
      ${data.input.brandVoice},
      ${data.input.title},
      ${data.input.brief},
      ${data.output.metaTitle},
      ${data.output.metaDescription},
      ${data.output.slug},
      ${data.output.url},
      ${JSON.stringify(data.output.ogTags)},
      ${JSON.stringify(data.output.schemaJsonLd)},
      ${JSON.stringify(data.output.twitterTags)},
      'openai',
      'gpt-4o-mini',
      ${data.tokens.input},
      ${data.tokens.output},
      'success',
      now()
    )
    RETURNING id
  `;

	const rows = Array.isArray(result) ? result : (result as any).rows || [];

	if (rows.length === 0) {
		throw new Error('Failed to insert generation record');
	}

	console.log(`✅ Generation saved - ID: ${rows[0].id}, User: ${data.userId}`);

	return { id: rows[0].id };
}

/**
 * Save failed generation to database for debugging
 */
export async function insertGenerationError(data: InsertGenerationError, env: DbEnv): Promise<{ id: string }> {
	const sql = getSql(env);

	const result = await sql`
    INSERT INTO generations (
      user_id,
      plan_id,
      content_type,
      language,
      tone,
      input_title,
      input_brief,
      provider,
      model,
      tokens_input,
      tokens_output,
      status,
      error_message,
      created_at
    )
    VALUES (
      ${data.userId},
      ${data.planId},
      ${data.input.contentType},
      ${data.input.language},
      ${data.input.tone},
      ${data.input.title},
      ${data.input.brief},
      'openai',
      'gpt-4o-mini',
      ${data.tokens.input},
      ${data.tokens.output},
      'failed',
      ${data.error},
      now()
    )
    RETURNING id
  `;

	const rows = Array.isArray(result) ? result : (result as any).rows || [];

	if (rows.length === 0) {
		throw new Error('Failed to insert error record');
	}

	console.log(`❌ Error logged - ID: ${rows[0].id}, User: ${data.userId}`);

	return { id: rows[0].id };
}

/**
 * Get generation history for a user
 */
export async function getUserGenerations(userId: string, limit: number = 50, env?: DbEnv): Promise<any[]> {
	if (!env) return [];

	const sql = getSql(env);

	const result = await sql`
    SELECT 
      id,
      content_type,
      input_title,
      meta_title,
      status,
      tokens_input,
      tokens_output,
      created_at
    FROM generations
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

	return Array.isArray(result) ? result : (result as any).rows || [];
}
