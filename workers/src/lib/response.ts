/**
 * Standard API error response format
 */
export type ApiError = {
	code: string;
	message: string;
	details?: unknown;
};

/**
 * Success response with data
 */
export type ApiSuccessResponse<T> = {
	ok: true;
	data: T;
};

/**
 * Error response
 */
export type ApiErrorResponse = {
	ok: false;
	error: ApiError;
};

/**
 * Union type for all API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Generation response data
 */
export type GenerationResponseData = {
	generationId: string;
	userId: string;
	usage: {
		used: number;
		limit: number;
	};
	tokens: {
		input: number;
		output: number;
	};
	result: {
		metaTitle: string;
		metaDescription: string;
		slug: string;
		url: string;
		schemaJsonLd: any;
		ogTags: Record<string, string>;
		twitterTags: Record<string, string>;
	};
};

/**
 * Create success response
 */
export function successResponse<T>(data: T): ApiSuccessResponse<T> {
	return {
		ok: true,
		data,
	};
}

/**
 * Create error response
 */
export function errorResponse(code: string, message: string, details?: unknown): ApiErrorResponse {
	const errorObj: any = {
		code,
		message,
	};

	if (details !== undefined) {
		errorObj.details = details;
	}

	return {
		ok: false,
		error: errorObj,
	};
}

/**
 * Format response as HTTP Response
 */
export function formatResponse<T>(apiResponse: ApiResponse<T>, status: number = 200): Response {
	return new Response(JSON.stringify(apiResponse), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

/**
 * Predefined error responses
 */
export const ERRORS = {
	MISSING_AUTH_HEADER: () => errorResponse('MISSING_AUTH_HEADER', 'Authorization header required. Use: Authorization: Bearer <token>'),

	INVALID_AUTH_TOKEN: () => errorResponse('INVALID_AUTH_TOKEN', 'Invalid authentication token'),

	TOKEN_EXPIRED: () => errorResponse('TOKEN_EXPIRED', 'Token expired. Please request a new token.'),

	TOKEN_REVOKED: () => errorResponse('TOKEN_REVOKED', 'This token has been revoked. Please request a new token.'),

	INVALID_REQUEST: () => errorResponse('INVALID_REQUEST', 'contentType and title are required'),

	QUOTA_EXCEEDED: (used: number, limit: number) => errorResponse('QUOTA_EXCEEDED', 'Monthly limit reached', { limit, used }),

	OPENAI_ERROR: (message: string) => errorResponse('OPENAI_ERROR', `OpenAI API error: ${message}`),

	OPENAI_QUOTA: () => errorResponse('OPENAI_QUOTA', 'OpenAI quota exceeded. Please top up your account.'),

	VALIDATION_FAILED: (errors: any) => errorResponse('VALIDATION_FAILED', 'OpenAI response failed validation', { errors }),

	STORAGE_FAILED: () => errorResponse('STORAGE_FAILED', 'Failed to save generation record'),

	INTERNAL_ERROR: () => errorResponse('INTERNAL_ERROR', 'Internal server error'),
};
