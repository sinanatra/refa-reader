import { writable } from 'svelte/store';
import { base } from '$app/paths';
import * as config from '@setup';

export const db = writable([]);

function normalizeOmekaId(url) {
	if (!url || !config.api) return url;

	try {
		const originalUrl = new URL(url);
		const configuredApiUrl = new URL(config.api);

		const apiIndex = originalUrl.pathname.indexOf('/api');
		if (apiIndex === -1) return url;

		const pathAfterApi = originalUrl.pathname.slice(apiIndex + 4);

		const basePath = configuredApiUrl.pathname.replace(/\/$/, '');

		return (
			configuredApiUrl.origin +
			basePath +
			pathAfterApi +
			(originalUrl.search || '') +
			(originalUrl.hash || '')
		);
	} catch {
		return url;
	}
}

function normalizeIdsDeep(obj) {
	if (!obj || typeof obj !== 'object') return obj;

	for (const key in obj) {
		if (key === '@id' && typeof obj[key] === 'string') {
			const original = obj[key];
			let replaced = original
				.replace(/\/items\//, '/resources/')
				.replace(/\/media\//, '/resources/')
				.replace(/\/item_sets\//, '/resources/');
			replaced = normalizeOmekaId(replaced);

			// if (original.includes('67423') || replaced.includes('67423')) {
			// 	console.log(`Found specific @id:`, original);
			// 	console.log(`Normalized @id:`, original, '→', replaced);
			// }

			if (original !== replaced) {
				obj[key] = replaced;
			}
		} else if (typeof obj[key] === 'object') {
			normalizeIdsDeep(obj[key]);
		}
	}
	return obj;
}

export async function loadDb() {
	try {
		const url = config.local.includes('http') ? config.local : `${base}/${config.local}`;
		console.log(`Fetching URL: ${url}`);
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to load db: ${response.statusText} (Status: ${response.status})`);
		}

		const contentType = response.headers.get('content-type');
		if (!contentType || !contentType.includes('application/json')) {
			throw new Error('Response is not valid JSON');
		}

		const data = await response.json();

		const normalizedData = data.map((item) => normalizeIdsDeep(item));

		db.set(normalizedData);
		console.log('Database loaded and all @id fields normalized.');
	} catch (error) {
		console.error('Error loading db.json:', error);
	}
}
