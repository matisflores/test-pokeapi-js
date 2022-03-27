var PokeapiClient = function () {
    var client = {
        endpoint: 'https://pokeapi.co/api/v2/pokemon/',
        imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{0}.png',
        data: {},
        loaded: false
    };
    setTimeout('PokeapiClient.load()', 500);

    return client;
}();

PokeapiClient.load = function () {
    // TODO progressive load
    const url = PokeapiClient.endpoint + '?limit=2000';

    WebApp._request(url, 'GET', null, null, function (response) {
        const responseObj = JSON.parse(response);
        if (responseObj.results !== undefined) {
            PokeapiClient.data = responseObj.results;
            PokeapiClient.loaded = true;
        }
    }, function (response) {
        console.error(response);
    });
};

PokeapiClient.search = function (prefix) {
    if (!PokeapiClient.loaded) {
        return;
    }

    const search = new RegExp('^' + prefix, 'i');
    function idExtractor(pokemon) {
        var rx = /\/(\d+)\/$/g;
        var arr = rx.exec(pokemon.url);
        return arr[1];
    }

    return PokeapiClient.data.filter(function (pokemon) {
        //get only pokemons with 'prefix' prefix
        return pokemon.name.match(search);
    }).map(function (pokemon) {
        var id = idExtractor(pokemon);

        //hydrate id and image values
        pokemon.id = id;
        pokemon.image = PokeapiClient.imageUrl.format(id);
        return pokemon;
    });
};
