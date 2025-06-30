<script>
	export let title;
	export let lang;
	export let description;
</script>

<header>
	<h1>{title}</h1>
	{#if description[lang]}
		<h3>
			{@html description[lang]}
		</h3>
	{/if}
</header>

<style>
	header {
		padding: 10px;
		flex: 0 0 380px;
		background-color: #efefef;
	}

	h1 {
		min-height: 150px;
		font-size: 30px;
		line-height: 30px;
		padding-bottom: 10px;
	}

	h3 {
		font-weight: 400;
		font-size: 1.2rem;
	}
	span {
		color: blue;
	}

	@media only screen and (max-width: 800px) {
		h3 {
			width: 100%;
			padding-top: 20px;
		}
	}
</style>
