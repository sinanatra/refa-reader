import * as config from '@setup';
import newUniqueId from 'locally-unique-id-generator';

export async function extractLinks(markdown, mdData) {
	const regex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*?>(.*?)<\/a>/g;
	const links = [];

	let match;
	while ((match = regex.exec(markdown))) {
		if (match[2].includes('http') && !match[2].includes(config.url)) {
			continue;
		} else {
			const label = match[3];
			const url = decodeURIComponent(match[2]);
			// const id = url.split("/")[1] || url.split("/")[0];
			// console.log(label, id, url)

			links.push({
				label,
				id: url,
				url: url,
				data: []
			});
		}
	}

	const allUrls = links.filter((link) => link.url).map((link) => link.id);

	let parseItems = [...getItemsFromDbById(allUrls, mdData, 'items')];

	for (let i = 0; i < links.length; i++) {
		const link = links.find((d) => parseItems[i]?.['@id'].includes(d.id));
		const json = parseItems[i];
		if (link) {
			link.uniqueId = newUniqueId();
			link.data = json;
		}
	}

	return links;
}

// Accepts both full URLs and Omeka IDs
function getItemsFromDbById(ids, db, type) {
	return db.filter((item) => {
		const itemId = item['@id'];
		// Check direct match
		if (ids.includes(itemId)) return true;

		// Try replacing /media/, /items/, /item_sets/ to /resources/
		const normalizedId = itemId
			?.replace(/\/items\//, '/resources/')
			?.replace(/\/media\//, '/resources/')
			?.replace(/\/item_sets\//, '/resources/');
		if (ids.includes(normalizedId)) return true;

		// Try checking if any provided id matches after normalization
		return ids.some(
			(id) => id === itemId || id === normalizedId || itemId.endsWith('/' + id) // e.g. just the numeric part
		);
	});
}

export async function createTriplets(data) {
	let allTriplets = [];

	for (let i = 0; i < data.length; i++) {
		if (data[i].data) {
			let jsonLD = data[i].data;
			let set = data[i].set || null; // omeka-s
			let triplets = parseJSONLD(jsonLD, set);

			allTriplets = [...allTriplets, ...triplets];
		}
	}

	const graph = {
		nodes: allTriplets.reduce((acc, curr) => {
			if (!acc.find((n) => n.id === curr.source)) {
				acc.push({ id: curr.source, title: curr.title });
			}
			if (!acc.find((n) => n.id === curr.target)) {
				acc.push({ id: curr.target, title: curr.title });
			}
			return acc;
		}, []),
		links: allTriplets
	};

	return { ...graph };
}

export function parseJSONLD(jsonLD, set) {
	let triplets = [];
	let source = jsonLD['@id'];

	// omeka s
	if (set) {
		triplets.push({
			source: set['@id'],
			target: source,
			img:
				jsonLD[config.paths.img[0]]?.[0]['@id'] ||
				getNestedValue(jsonLD, config.paths.img.join('.')),
			title: jsonLD[config.title]
		});
	}

	let parentKey;
	let reverse = false;

	const regex = /\b[a-zA-Z]+\d+[a-zA-Z]*\s/;

	const parseRecursive = function (obj) {
		for (let key in obj) {
			if (
				key === '@id' ||
				(key === '@value' &&
					(obj[config.paths.title] || obj.display_title || obj['@id'] || reverse))
			) {
				let target = obj['@id'];

				target = target
					?.replace(/\/items\//, '/resources/')
					.replace(/\/media\//, '/resources/')
					.replace(/\/item_sets\//, '/resources/');

				const title = obj[config.paths.title] || obj.display_title || obj['@id']; // omeka s
				const img =
					obj?.thumbnail_url ||
					obj?.[config.paths.img?.[0]]?.[0]?.['@id'] ||
					getNestedValue(obj, config.paths.img.join('.')); // omeka s

				let property =
					obj[config.property]?.replace('_', ' ')?.replace(regex, '') ||
					parentKey?.replace(regex, '');

				const exists = triplets.some(
					(triplet) => triplet.source === source && triplet.target === target
				);

				// console.log(property)

				if (!exists && !config.hideProperties.includes(property)) {
					triplets.push({
						source: source,
						target: target,
						title,
						img,
						property,
						reverse,
						external: target.includes(config.url) ? false : true
					});
				}
			} else if (typeof obj[key] === 'object') {
				if (isNaN(key)) {
					const parts = key?.split(':');
					const label = parts[1]?.split('_')?.join(' ');
					parentKey = label;

					if (key === '@reverse') {
						reverse = true;
					}
				}
				parseRecursive(obj[key]);
			}
		}
	};

	parseRecursive(jsonLD);

	return triplets;
}

export function getNestedValue(obj, path) {
	return path.split('.').reduce((o, key) => (o || {})[key], obj);
}
export function getItemThumbnail(item, allEntities, preferredSize = 'large') {
  if (!item) return null;
  
  // Direct: sometimes image is in the item
  if (item.thumbnail_display_urls && item.thumbnail_display_urls[preferredSize]) {
    return item.thumbnail_display_urls[preferredSize];
  }

  // Or in o:media
  const mediaArr = item['o:media'];
  if (!mediaArr || !mediaArr.length) return null;

  for (let mediaRef of mediaArr) {
    // Find media entity
    let mediaObj = allEntities.find(ent => ent['@id'] === mediaRef['@id'] || ent['o:id'] === mediaRef['o:id']);
    if (mediaObj?.thumbnail_display_urls && mediaObj.thumbnail_display_urls[preferredSize]) {
      return mediaObj.thumbnail_display_urls[preferredSize];
    }
  }

  return null;
}
