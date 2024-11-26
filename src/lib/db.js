import { writable } from 'svelte/store';
import { base } from '$app/paths';
import * as config from '@setup';


export const db = writable([]);
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
        db.set(
            data.map((d) => ({
                ...d,
                "@id": d["@id"]
                    ?.replace(/\/items\//, '/resources/')
                    ?.replace(/\/media\//, '/resources/')
                    ?.replace(/\/item_sets\//, '/resources/')
            }))
        );
        console.log('Database loaded successfully.');

    } catch (error) {
        console.error('Error loading db.json:', error);
    }
}

