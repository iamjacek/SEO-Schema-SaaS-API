export type ValidationError = {
	field: string;
	error: string;
};

export type ValidationResult = {
	valid: boolean;
	errors: ValidationError[];
};

/**
 * Validate SEO schema result from OpenAI
 * Checks all required fields and data types
 */
export function validateGenerateResult(result: any): ValidationResult {
	const errors: ValidationError[] = [];

	// Validate metaTitle
	if (typeof result?.metaTitle !== 'string' || !result.metaTitle.trim()) {
		errors.push({
			field: 'metaTitle',
			error: 'Must be a non-empty string',
		});
	} else if (result.metaTitle.length > 60) {
		errors.push({
			field: 'metaTitle',
			error: `Must be ≤60 chars (got ${result.metaTitle.length})`,
		});
	}

	// Validate metaDescription
	if (typeof result?.metaDescription !== 'string' || !result.metaDescription.trim()) {
		errors.push({
			field: 'metaDescription',
			error: 'Must be a non-empty string',
		});
	} else if (result.metaDescription.length > 155) {
		errors.push({
			field: 'metaDescription',
			error: `Must be ≤155 chars (got ${result.metaDescription.length})`,
		});
	}

	// Validate slug
	if (typeof result?.slug !== 'string' || !result.slug.trim()) {
		errors.push({
			field: 'slug',
			error: 'Must be a non-empty string',
		});
	} else if (!/^[a-z0-9-]+$/.test(result.slug)) {
		errors.push({
			field: 'slug',
			error: 'Must only contain lowercase letters, numbers, and hyphens',
		});
	}

	// Validate url
	if (typeof result?.url !== 'string' || !result.url.trim()) {
		errors.push({
			field: 'url',
			error: 'Must be a non-empty string',
		});
	} else if (!isValidUrl(result.url)) {
		errors.push({
			field: 'url',
			error: 'Must be a valid URL',
		});
	}

	// Validate schemaJsonLd
	if (typeof result?.schemaJsonLd !== 'object' || result.schemaJsonLd === null) {
		errors.push({
			field: 'schemaJsonLd',
			error: 'Must be a non-null object',
		});
	} else {
		if (typeof result.schemaJsonLd['@context'] !== 'string') {
			errors.push({
				field: 'schemaJsonLd.@context',
				error: 'Must be a string',
			});
		} else if (result.schemaJsonLd['@context'] !== 'https://schema.org') {
			errors.push({
				field: 'schemaJsonLd.@context',
				error: 'Must be "https://schema.org"',
			});
		}

		if (typeof result.schemaJsonLd['@type'] !== 'string') {
			errors.push({
				field: 'schemaJsonLd.@type',
				error: 'Must be a string',
			});
		} else if (!['Article', 'Product', 'LocalBusiness', 'Service'].includes(result.schemaJsonLd['@type'])) {
			errors.push({
				field: 'schemaJsonLd.@type',
				error: 'Must be one of: Article, Product, LocalBusiness, Service',
			});
		}

		if (typeof result.schemaJsonLd.url !== 'string' || !result.schemaJsonLd.url.trim()) {
			errors.push({
				field: 'schemaJsonLd.url',
				error: 'Must be a non-empty string',
			});
		}
	}

	// Validate ogTags
	if (typeof result?.ogTags !== 'object' || result.ogTags === null) {
		errors.push({
			field: 'ogTags',
			error: 'Must be a non-null object',
		});
	} else {
		const requiredOgTags = ['og:title', 'og:description', 'og:type', 'og:url', 'og:image'];
		for (const tag of requiredOgTags) {
			if (typeof result.ogTags[tag] !== 'string' || !result.ogTags[tag].trim()) {
				errors.push({
					field: `ogTags.${tag}`,
					error: 'Must be a non-empty string',
				});
			}
		}
	}

	// Validate twitterTags
	if (typeof result?.twitterTags !== 'object' || result.twitterTags === null) {
		errors.push({
			field: 'twitterTags',
			error: 'Must be a non-null object',
		});
	} else {
		const requiredTwitterTags = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
		for (const tag of requiredTwitterTags) {
			if (typeof result.twitterTags[tag] !== 'string' || !result.twitterTags[tag].trim()) {
				errors.push({
					field: `twitterTags.${tag}`,
					error: 'Must be a non-empty string',
				});
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Check if string is a valid URL
 */
function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

/**
 * Format validation errors for API response
 */
export function formatValidationErrors(errors: ValidationError[]): string {
	return errors.map((e) => `${e.field}: ${e.error}`).join(' | ');
}
