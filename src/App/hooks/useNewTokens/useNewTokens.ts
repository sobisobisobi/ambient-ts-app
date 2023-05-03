import { useEffect, useState } from 'react';
import { tokenListURIs } from '../../../utils/data/tokenListURIs';
import fetchTokenList from '../../../utils/functions/fetchTokenList';
import { TokenIF, TokenListIF } from '../../../utils/interfaces/exports';

export const useNewTokens = () => {
    const tokenListsLocalStorageKey = 'tokenLists';

    function getTokenListsFromLS(): TokenListIF[] {
        return JSON.parse(localStorage.getItem(tokenListsLocalStorageKey) as string);
    }

    const [tokenLists, setTokenLists] = useState<TokenListIF[]>(
        getTokenListsFromLS() ?? []
    );
    
    useEffect(() => {
        // create an array of promises to fetch all token lists in the URIs file
        const tokenListPromises: Promise<TokenListIF>[] = Object.values(
            tokenListURIs,
        ).map((uri: string) => fetchTokenList(uri, false));
        Promise.allSettled(tokenListPromises)
            // format returned data into a useful form for the app
            // 1st val ➡ indicates if second val is a value
            // 2nd val ➡ value returned by promise
            .then((promises) => promises.flatMap((promise) => Object.entries(promise))
                .filter((promise) => promise[0] === 'value')
                .map((promise) => promise[1])
            )
            // middleware to add metadata used by the Ambient platform
            .then((lists) => {
                // indicate which list each token data object was imported with
                lists.forEach((list) => {
                    list.refreshAfter = Date.now() + 14400000;
                    list.tokens.forEach(
                        (token: TokenIF) => (token.fromList = list.uri),
                    )
                });
                setTokenLists(lists);
                localStorage.setItem(tokenListsLocalStorageKey, JSON.stringify(lists));
            });
    }, []);

    useEffect(() => console.log(tokenLists), [tokenLists]);
};
