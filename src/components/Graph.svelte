<script>
	import { onMount, afterUpdate } from 'svelte';
	import { graphSteps, graphScroll } from '@stores';
	import { db } from '@db';
	import { getNestedValue } from '@utils';
	import { writable } from 'svelte/store';
	import GraphSection from '@components/GraphSection.svelte';

	export let updatePosition;
	export let handlePosition;
	export let data;
	export let visibleItemsID;
	export let essaysItems;
	export let config;
	export let items;
	export let screenSize;

	let scrollTopVal;
	const entities = writable([]);

	let batchSize = config.batch;
	let graph;
	let markdownNodes = data.nodes.filter((d) => visibleItemsID.includes(d.id));

	onMount(async () => {
		loadData(data.nodes, batchSize);
	});

	afterUpdate(() => {
		if (graph.lastElementChild && screenSize > 600) {
			graph.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
		}
		handlePosition();
	});

	$: dataToGraph = items
		.filter((d) => d?.data)
		.map((d) => {
			return {
				img:
					d.data[config.paths.img?.[0]]?.[0]?.['@id'] ||
					getNestedValue(d.data, config.paths.img.join('.')),
				source: `item_${d.id}`,
				target: d.data?.['@id'],
				title: d.data?.[config.paths.title] || d.data?.['@id'] || ''
			};
		});

	$: if (
		($graphSteps && $graphSteps.length == 0) ||
		(graphSteps && $graphSteps?.[0]?.data.length == 0)
	) {
		$graphSteps[0] = {
			data: dataToGraph,
			new: dataToGraph,
			page: 0,
			paginate: dataToGraph
		};
	}

	async function loadData(nodes, batchSize) {
		const ids = nodes.map((d) => d.id || d.target);

		if (data.links) {
			data.links.forEach((link) => {
				if (!ids.includes(link.target)) ids.push(link.target);
				if (!ids.includes(link.source)) ids.push(link.source);
			});
		}

		const uniqueIds = Array.from(new Set(ids));
		const numBatches = Math.ceil(uniqueIds.length / batchSize);

		for (let i = 0; i < numBatches; i++) {
			const batchIds = uniqueIds.slice(i * batchSize, (i + 1) * batchSize);

			let jsonItems = $db.filter((d) => batchIds.includes(d['@id']));
			entities.update((items) => {
				for (const item of jsonItems) {
					if (!items.some((e) => e['@id'] === item['@id'])) {
						items.push(item);
					}
				}
				return items;
			});
		}
	}

	let col;

	const getPaginatedData = (index, col) => {
		if (col != null) {
			const page = $graphSteps[index]?.page + 1 || 0;
			$graphSteps[index] = {
				...$graphSteps[index],
				page,
				paginate: $graphSteps[index]?.data.slice(0, page * batchSize)
			};
			if (
				$graphSteps[index]?.data &&
				$graphSteps[index]?.paginate.length != $graphSteps[index]?.data.length
			) {
				loadData($graphSteps[index].paginate.slice(-batchSize), batchSize);
			}
		}
	};

	let idx = 0;
	$: handleScroll(scrollTopVal);

	function handleScroll(scrollTopVal) {
		if ($graphScroll) {
			const items = document.querySelectorAll('.links:first-of-type .node');
			let firstInGraph = items?.[idx]?.offsetTop;
			let firstInGraphId = items?.[idx]?.getAttribute('data-id');
			let secondInGraph = items?.[idx + 1]?.offsetTop;
			let secondInGraphId = items?.[idx + 1]?.getAttribute('data-id');
			let firstInEssay = document.querySelector(
				`.node-highlite[data-id="${firstInGraphId}"]`
			)?.offsetTop;
			let secondInEssay = document.querySelector(
				`.node-highlite[data-id="${secondInGraphId}"]`
			)?.offsetTop;
			let percentageDistance = getPercentageDistance(scrollTopVal, firstInGraph, secondInGraph);
			let pixelDistance = getPixelDistance(percentageDistance, firstInEssay, secondInEssay);
			const selectedItem = document.querySelector('.markdown__container');

			if (scrollTopVal > secondInGraph) {
				idx++;
			}

			if (scrollTopVal < firstInGraph && idx != 0) {
				idx--;
			}

			if (selectedItem && pixelDistance && firstInGraph !== secondInGraph && pixelDistance > 0) {
				selectedItem?.scrollTo({
					top: pixelDistance
				});
			}
		}
	}

	function getPercentageDistance(scrollTop, firstPoint, secondPoint) {
		const totalDistance = secondPoint - firstPoint;
		const distanceFromFirst = scrollTop - firstPoint;
		const percentage = (distanceFromFirst / totalDistance) * 100;
		return percentage;
	}

	function getPixelDistance(percentage, firstPoint, secondPoint) {
		const distanceFromFirst = secondPoint - firstPoint;
		return firstPoint + (distanceFromFirst * percentage) / 100;
	}
</script>

<div class="graph" bind:this={graph}>
	{#if $entities.length == 0}
		<div>
			<h4 class="loading">Loading Graph...</h4>
		</div>
	{:else}
		{#each $graphSteps as step, index}
			{#if step?.new && step?.new.length > 0}
				<div
					class="links"
					id="col_{index}"
					bind:this={col}
					on:scroll={() => {
						let col0 = document.querySelector('#col_0');
						col0.addEventListener('scroll', (event) => {
							scrollTopVal = col0?.scrollTop;
						});
						handlePosition();
					}}
					on:click={() => {
						handlePosition();
					}}
					on:keypress={() => {
						handlePosition();
					}}
				>
					<div>
						{#each config.mainCategories as cat}
							{@const filteredData = step.paginate.filter((d) => cat.props.includes(d.property))}
							{@const dataLen = step.data.filter((d) => cat.props.includes(d.property)).length}

							{#if filteredData.length > 0}
								<GraphSection
									site={config.publicSite}
									{essaysItems}
									category={cat.key}
									data={filteredData}
									newData={step.new}
									{dataLen}
									{index}
									{entities}
									{updatePosition}
									{batchSize}
									defaultNodes={[...markdownNodes]}
									{loadData}
								/>
							{/if}
						{/each}

						{#if step.paginate.filter((d) => !config.mainCategories.some( (cat) => cat.props.includes(d.property) )).length > 0}
							{@const filteredSecondaryData = step.paginate.filter(
								(d) => !config.mainCategories.some((cat) => cat.props.includes(d.property))
							)}
							{@const dataLen = step.data.filter(
								(d) => !config.mainCategories.some((cat) => cat.props.includes(d.property))
							).length}

							{#if filteredSecondaryData.length > 0}
								<GraphSection
									site={config.publicSite}
									{essaysItems}
									category={''}
									data={filteredSecondaryData}
									newData={step.new}
									{dataLen}
									{index}
									{entities}
									{updatePosition}
									{batchSize}
									defaultNodes={[...markdownNodes]}
									{loadData}
								/>
							{/if}
						{/if}
						{#if step.paginate.length < step.new.length}
							<div
								class="more"
								on:click={() => getPaginatedData(index, col)}
								on:keydown={() => getPaginatedData(index, col)}
							>
								Load more
							</div>
						{/if}
					</div>
				</div>
				<!-- {:else} -->
				<!-- <div class="no-items">There are no connections.</div> -->
			{/if}
		{/each}
	{/if}
</div>
{#if $graphSteps.length > 1}
	<div
		class="close"
		on:click={() => {
			$graphSteps = [];
			handlePosition();
		}}
		on:keypress={() => {
			$graphSteps = [];
		}}
	>
		✕
	</div>
{/if}

<style>
	.more {
		padding-top: 10px;
		padding-bottom: 20px;
		text-align: center;
		color: gainsboro;
		cursor: pointer;
	}
	.more:hover {
		color: black;
	}

	.loading,
	.no-items {
		font-size: 1rem;
		text-align: center;
		color: gainsboro;
		height: calc(100vh - 20px);
		padding-top: 1rem;
		margin-bottom: 10px;
	}

	.close {
		width: 25px;
		height: 25px;
		position: fixed;
		top: 5px;
		right: 5px;
		border-radius: 100%;
		background-color: white;
		border: 1px solid var(--theme-color);
		color: var(--theme-color);
		text-align: center;
		line-height: 25px;
		font-family: 'Inter', sans-serif;
		z-index: 100;
		cursor: pointer;
	}
	.close:hover {
		background-color: var(--theme-color);
		color: white;
		/* font-weight: bolder; */
		/* width: 30px;
		height: 30px;
		line-height: 28px; */
	}

	.graph {
		display: flex;
		user-select: none;
		background-color: white;
		background-color: var(--graph-bg);

		height: 100vh;
	}

	.links {
		background-color: white;
		background-color: var(--graph-bg);

		height: fit-content;
		max-height: calc(100vh - 20px);
		margin-left: 12vw;
		overflow: scroll;
		flex-grow: 0;
		flex-shrink: 0;
		cursor: pointer;
		word-wrap: break-word;
		z-index: 2;
		padding-top: 20px;
	}

	.links:first-of-type {
		margin-left: 1.5vw;
	}

	.links:last-of-type {
		padding-right: 20px;
	}

	@media only screen and (max-width: 800px) {
		.links:not(:first-of-type) {
			margin-left: 30vw;
		}
	}
</style>
