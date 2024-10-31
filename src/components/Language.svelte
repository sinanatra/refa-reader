<script>
	export let lang;
	export let languages;
	function switchLanguage(newLang) {
		lang = newLang;
		localStorage.setItem('selectedLanguage', newLang);
	}
</script>

{#if languages.length > 1}
	<div>
		{#each languages as language}
			<span
				on:click={() => switchLanguage(language)}
				on:keydown={() => switchLanguage(language)}
				class:selected={lang === language}
				disabled={lang === language}>{language.toUpperCase()}</span
			>
		{/each}
	</div>
{/if}

<style>
	div {
		position: absolute;
		top: 5px;
		right: 10px;
		cursor: pointer;
		background-color: white;
	}

	span::after {
		content: '/';
	}

	span:last-of-type::after {
		content: '';
	}

	.selected {
		color: blue;
	}
</style>
