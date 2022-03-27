function search() {
	const searchText = $('#searchBox').val();

	if (searchText === '') {
		$('#searchResults').toggle(false);
		return;
	}

	const results = PokeapiClient.search(searchText) || [];

	WebApp._parse('searchResults', 'searchResults', { pokemons: results, qty: results.length }, function () {
		$('#searchResults').toggle(true);
	});
}
