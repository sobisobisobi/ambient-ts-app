import { TokenPairIF } from '../../../../utils/interfaces/exports';
import styles from './SidebarSearchResults.module.css';
import PoolsSearchResults from './PoolsSearchResults/PoolsSearchResults';
import PositionsSearchResults from './PositionsSearchResults/PositionsSearchResults';
import OrdersSearchResults from './OrdersSearchResults/OrdersSearchResults';
import TxSearchResults from './TxSearchResults/TxSearchResults';
import { PoolStatsFn } from '../../../functions/getPoolStats';
import { sidebarSearchIF } from '../useSidebarSearch';
import { useAppSelector } from '../../../../utils/hooks/reduxToolkit';

interface propsIF {
    tokenPair: TokenPairIF;
    cachedPoolStatsFetch: PoolStatsFn;
    isDenomBase: boolean;
    searchData: sidebarSearchIF;
}

export default function SidebarSearchResults(props: propsIF) {
    const { searchData, tokenPair, cachedPoolStatsFetch, isDenomBase } = props;
    const { isLoggedIn: isUserConnected } = useAppSelector(
        (state) => state.userData,
    );

    return (
        <div className={styles.container}>
            <div className={styles.search_result_title}>Search Results</div>
            <PoolsSearchResults
                searchedPools={searchData.pools}
                tokenPair={tokenPair}
                cachedPoolStatsFetch={cachedPoolStatsFetch}
            />
            {isUserConnected && (
                <>
                    <TxSearchResults searchedTxs={searchData.txs} />
                    <OrdersSearchResults
                        searchedLimitOrders={searchData.limits}
                        isDenomBase={isDenomBase}
                    />
                    <PositionsSearchResults
                        searchedPositions={searchData.positions}
                        isDenomBase={isDenomBase}
                    />
                </>
            )}
        </div>
    );
}
