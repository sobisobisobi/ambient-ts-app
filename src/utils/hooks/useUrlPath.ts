import { useLocation, useParams } from 'react-router-dom';

export const useUrlPath = (chainId: string) => {
    false && chainId;

    // index of all base URL pathways in the Ambient app
    const BASE_URL_PATHS = {
        index: '',
        home: '',
        swap: '/swap',
        trade: '/trade',
        market: '/trade/market',
        limit: '/trade/limit',
        range: '/trade/range',
        reposition: '/reposition',
        tos: '/tos',
        testpage: '/testpage',
        account: '/account',
        privacy: '/privacy',
    };

    interface swapParamsIF {
        chain: string,
        tokenA: string,
        tokenB: string,
    }
    interface marketParamsIF {
        chain: string,
        tokenA: string,
        tokenB: string,
    }
    interface limitParamsIF {
        chain: string,
        tokenA: string,
        tokenB: string,
    }
    interface rangeParamsIF {
        chain: string,
        tokenA: string,
        tokenB: string,
        highTick?: string,
        lowTick?: string,
    }
    interface repoParamsIF {
        chain: string,
        tokenA: string,
        tokenB: string,
        highTick: string,
        lowTick: string,
    }

    // type containing all the URL parameter interfaces
    type anyParamIFs = swapParamsIF |
        marketParamsIF |
        limitParamsIF |
        rangeParamsIF |
        repoParamsIF;

    const location = useLocation();

    // type that maps to keys (strings) in the BASE_URL_PATHS object
    type pageNames = keyof typeof BASE_URL_PATHS;

    // fn to return a base URL slug for a given page
    function buildURL(page: pageNames, paramsObj: anyParamIFs): string {
        const baseUrl: string = BASE_URL_PATHS[page];
        const paramsSlug: string = Object.entries(paramsObj)
            .map((tup: string[]) => tup.join('='))
            .join('&');
        return baseUrl + '/' + paramsSlug;
    }

    return {
        location,
        getPath: {
            toSwap: (params: swapParamsIF) => buildURL('swap', params),
            toMarket: (params: marketParamsIF) => buildURL('market', params),
            toLimit: (params: limitParamsIF) => buildURL('limit', params),
            toRange: (params: rangeParamsIF) => buildURL('range', params),
            toRepo: (params: repoParamsIF) => buildURL('reposition', params)
        },
    };
};
