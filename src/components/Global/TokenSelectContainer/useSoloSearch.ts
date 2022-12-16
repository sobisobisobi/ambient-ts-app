import { useEffect, useMemo, useState, Dispatch, SetStateAction } from 'react';
import { TokenIF } from '../../../utils/interfaces/exports';

export const useSoloSearch = (
    chainId: string,
    importedTokens: TokenIF[],
    verifyToken: (addr: string, chn: string) => boolean,
    getTokenByAddress: (addr: string, chn: string) => TokenIF | undefined,
    getTokensByName: (searchName: string, chn: string, exact: boolean) => TokenIF[]
): [TokenIF[], string, Dispatch<SetStateAction<string>>, string] => {
    // memoize default list of tokens to display in DOM
    const importedTokensOnChain = useMemo(() => (
        importedTokens.filter((tkn) => tkn.chainId === parseInt(chainId))
    ), [chainId]);
    
    // TODO: debounce this input later
    // TODO: figure out if we need to update EVERYTHING to the debounced value
    // raw input from the user
    const [input, setInput] = useState('');

    // search type => '' or 'address' or 'nameOrAddress'
    const [searchAs, setSearchAs] = useState('');

    // cleaned and validated version of raw user input
    const validatedInput = useMemo(() => {
        // trim string and make it lower case
        const cleanInput = input.trim().toLowerCase();
        // action if input appears to be a contract address
        if (
            cleanInput.length === 42 ||
            (cleanInput.length === 40 && !cleanInput.startsWith('0x'))
        ) {
            setSearchAs('address');
            // if not an apparent token address search name and symbol
        } else if (cleanInput.length >= 2) {
            setSearchAs('nameOrSymbol');
            return cleanInput;
            // otherwise treat as if there is no input entered
        } else {
            setSearchAs('');
            return '';
        }
        // add '0x' to the front of the cleaned string if not present
        const fixedInput = cleanInput.startsWith('0x') ? cleanInput : '0x' + cleanInput;
        // declare an output variable
        let output = cleanInput;
        // check if string is a correctly-formed contract address
        if (
            // check if string has 42 characters
            fixedInput.length === 42 &&
            // check if string after '0x' is valid hexadecimal
            fixedInput.substring(2).match(/[0-9a-f]/g)
        ) {
            // if fixed string is valid, assign it to the output variable
            output = fixedInput;
        }
        // return output variable
        return output;
    }, [input]);

    // hook to track tokens to output and render in DOM
    const [outputTokens, setOutputTokens] = useState<TokenIF[]>(importedTokensOnChain);
    // hook to update the value of outputTokens based on user input
    useEffect(() => {
        // logic in this hook branches based on user input type
        // code to run if user input appears to be a contract address
        if (searchAs === 'address') {
            // determined whether a known token exists for user input as an address
            // this check is run against tokens listed in `allTokenLists`
            const tokenExists = verifyToken(validatedInput, chainId);
            // if token exists in an imported list, send it to the output value
            if (tokenExists) {
                // get the token for the given address and chain
                const tokenAtAddress = getTokenByAddress(validatedInput, chainId);
                // send the value to local state
                // local state needs an array of tokens, so we put it in an array
                // technically value can be undefined but gatekeeping prevents that
                setOutputTokens([tokenAtAddress as TokenIF]);
            } else {
                const userToken = JSON.parse(
                    localStorage.getItem('user') as string
                ).tokens.find((tkn: TokenIF) =>
                    tkn.address.toLowerCase() === validatedInput.toLowerCase()
                );
                userToken && setOutputTokens([userToken]);
            }
        } else if (searchAs === 'nameOrSymbol') {
            const exactOnly = validatedInput.length === 2;
            const foundTokens = getTokensByName(validatedInput, chainId, exactOnly);
            JSON.parse(localStorage.getItem('user') as string).tokens
                .forEach((tkn: TokenIF) => {
                    if (
                        !exactOnly && (
                            tkn.name.toLowerCase().includes(validatedInput.toLowerCase()) ||
                            tkn.symbol.toLowerCase().includes(validatedInput.toLowerCase())
                        ) &&
                        !foundTokens.map((tok: TokenIF) => tok.address.toLowerCase()).includes(tkn.address)
                    ) {
                        foundTokens.push(tkn);
                    } else if (
                        exactOnly && (
                            tkn.name.toLowerCase() === validatedInput.toLowerCase() ||
                            tkn.symbol.toLowerCase() === validatedInput.toLowerCase()
                        ) &&
                        !foundTokens.map((tok: TokenIF) => tok.address.toLowerCase()).includes(tkn.address)
                    ) {
                        foundTokens.push(tkn);
                    }
                });
            setOutputTokens(foundTokens);
        } else {
            setOutputTokens(importedTokensOnChain);
        }
    }, [validatedInput]);

    return [outputTokens, validatedInput, setInput, searchAs];
};