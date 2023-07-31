// START: Import React and Dongles
import { useState, useRef, useContext, memo } from 'react';
import { BiSearch } from 'react-icons/bi';

// START: Import JSX Elements
import SidebarAccordion from './SidebarAccordion/SidebarAccordion';
import TopPools from '../../../components/Global/Sidebar/TopPools/TopPools';
import FavoritePools from '../../../components/Global/Sidebar/FavoritePools/FavoritePools';
import SidebarRangePositions from '../../../components/Global/Sidebar/SidebarRangePositions/SidebarRangePositions';
import SidebarLimitOrders from '../../../components/Global/Sidebar/SidebarLimitOrders/SidebarLimitOrders';
import SidebarRecentTransactions from '../../../components/Global/Sidebar/SidebarRecentTransactions/SidebarRecentTransactions';

// START: Import Local Files
import styles from './Sidebar.module.css';
import SidebarSearchResults from './SidebarSearchResults/SidebarSearchResults';
import { MdClose, MdOutlineExpand } from 'react-icons/md';
import { LuDroplets, LuFileClock } from 'react-icons/lu';

import closeSidebarImage from '../../../assets/images/sidebarImages/closeSidebar.svg';
import { AiFillLock, AiFillUnlock, AiOutlineHeart } from 'react-icons/ai';
import { BsChevronExpand, BsChevronContract } from 'react-icons/bs';
import RecentPools from '../../../components/Global/Sidebar/RecentPools/RecentPools';
import {
    useSidebarSearch,
    sidebarSearchIF,
} from './useSidebarSearch/useSidebarSearch';
import { SidebarContext } from '../../../contexts/SidebarContext';
import { CrocEnvContext } from '../../../contexts/CrocEnvContext';
import { useAppSelector } from '../../../utils/hooks/reduxToolkit';
import { TokenContext } from '../../../contexts/TokenContext';
import { CachedDataContext } from '../../../contexts/CachedDataContext';
import { DefaultTooltip } from '../../../components/Global/StyledTooltip/StyledTooltip';
import { GiBackwardTime, GiSaveArrow } from 'react-icons/gi';
import { TbFileTime } from 'react-icons/tb';

function Sidebar() {
    const { cachedPoolStatsFetch, cachedFetchTokenPrice } =
        useContext(CachedDataContext);
    const { chainData: chainData } = useContext(CrocEnvContext);
    const { tokens } = useContext(TokenContext);
    const { sidebar } = useContext(SidebarContext);

    const graphData = useAppSelector((state) => state.graphData);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [exploreSearchInput, setExploreSearchInput] = useState('');

    const filterFn = <T extends { chainId: string }>(x: T) =>
        x.chainId === chainData.chainId;

    const positionsByUser =
        graphData.positionsByUser.positions.filter(filterFn);
    const txsByUser = graphData.changesByUser.changes.filter(filterFn);
    const limitsByUser =
        graphData.limitOrdersByUser.limitOrders.filter(filterFn);

    const mostRecentTxs = txsByUser.slice(0, 4);
    const mostRecentPositions = positionsByUser
        .filter((p) => p.positionLiq > 0)
        .slice(0, 4);
    const mostRecentLimitOrders = limitsByUser.slice(0, 4);

    const recentPoolsData = [
        {
            name: 'Recent Pools',
            icon: (
                <GiBackwardTime
                    className={`${styles.icon} ${
                        !sidebar.isOpen && styles.closed
                    }`}
                    size={20}
                />
            ),

            data: (
                <RecentPools
                    cachedPoolStatsFetch={cachedPoolStatsFetch}
                    cachedFetchTokenPrice={cachedFetchTokenPrice}
                />
            ),
        },
    ];
    const topPoolsSection = [
        {
            name: 'Top Pools',
            icon: (
                <LuDroplets
                    className={`${styles.icon} ${
                        !sidebar.isOpen && styles.closed
                    }`}
                    size={20}
                />
            ),

            data: (
                <TopPools
                    cachedPoolStatsFetch={cachedPoolStatsFetch}
                    cachedFetchTokenPrice={cachedFetchTokenPrice}
                />
            ),
        },
    ];

    const rangePositions = [
        {
            name: 'Range Positions',
            icon: (
                <MdOutlineExpand
                    className={`${styles.icon} ${
                        !sidebar.isOpen && styles.closed
                    }`}
                    size={20}
                />
            ),
            data: <SidebarRangePositions userPositions={mostRecentPositions} />,
        },
    ];

    const recentLimitOrders = [
        {
            name: 'Limit Orders',
            icon: (
                <GiSaveArrow
                    className={`${styles.icon} ${
                        !sidebar.isOpen && styles.closed
                    }`}
                    size={20}
                />
            ),
            data: (
                <SidebarLimitOrders limitOrderByUser={mostRecentLimitOrders} />
            ),
        },
    ];

    const favoritePools = [
        {
            name: 'Favorite Pools',
            icon: (
                <AiOutlineHeart
                    className={`${styles.icon} ${
                        !sidebar.isOpen && styles.closed
                    }`}
                    size={20}
                />
            ),

            data: (
                <FavoritePools
                    cachedPoolStatsFetch={cachedPoolStatsFetch}
                    cachedFetchTokenPrice={cachedFetchTokenPrice}
                />
            ),
        },
    ];

    const recentTransactions = [
        {
            name: 'Transactions',
            icon: (
                <LuFileClock
                    className={`${styles.icon} ${
                        !sidebar.isOpen && styles.closed
                    }`}
                    size={20}
                />
            ),
            data: (
                <SidebarRecentTransactions
                    mostRecentTransactions={mostRecentTxs}
                />
            ),
        },
    ];

    const searchData: sidebarSearchIF = useSidebarSearch(
        positionsByUser,
        txsByUser,
        limitsByUser,
        tokens,
    );

    const [searchInput, setSearchInput] = useState<string>('');
    const [searchMode, setSearchMode] = useState(false);
    false && searchMode;

    const searchInputRef = useRef(null);

    const handleInputClear = () => {
        setSearchInput('');
        setSearchMode(false);
        const currentInput = document.getElementById(
            'search_input',
        ) as HTMLInputElement;
        currentInput.value = '';
    };

    // ------------------------------------------
    // ---------------------------Explore SEARCH CONTAINER-----------------------

    const focusInput = () => {
        const inputField = document.getElementById(
            'search_input',
        ) as HTMLInputElement;

        inputField.focus();
    };

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchMode(true);
        searchData.setInput(e.target.value);
        setSearchInput(e.target.value);
    };
    const searchContainer = (
        <div className={styles.search_container}>
            <div className={styles.search__icon} onClick={focusInput}>
                <BiSearch
                    size={18}
                    color={sidebar.isOpen ? 'var(--text2)' : 'var(--accent5)'}
                />
            </div>
            <input
                type='text'
                id='search_input'
                ref={searchInputRef}
                placeholder='Search...'
                className={styles.search__box}
                onChange={(e) => handleSearchInput(e)}
                spellCheck='false'
                tabIndex={1}
            />
            {searchInput && (
                <div onClick={handleInputClear} className={styles.close_icon}>
                    <MdClose size={20} color='#ebebeb66' />{' '}
                </div>
            )}
        </div>
    );

    const [openAllDefault, setOpenAllDefault] = useState(false);
    const [isDefaultOverridden, setIsDefaultOverridden] = useState(false);

    const getInitialSidebarLockedStatus = () =>
        sidebar.getStoredStatus() === 'open';
    const [isLocked, setIsLocked] = useState(getInitialSidebarLockedStatus());

    const toggleLockSidebar = () => {
        sidebar.open(!isLocked);
        isLocked && sidebar.resetStoredStatus();
        setIsLocked(!isLocked);
    };

    const toggleExpandCollapseAll = () => {
        setIsDefaultOverridden(true);
        setOpenAllDefault(!openAllDefault);
    };

    const controlIconStyle = { margin: 'auto' };

    const searchContainerDisplay = (
        <div
            className={` ${styles.sidebar_link_search} ${
                styles.main_search_container
            } ${!sidebar.isOpen && styles.sidebar_link_search_closed}`}
        >
            {searchContainer}
            {sidebar.isOpen ? (
                <div style={{ cursor: 'pointer', display: 'flex' }}>
                    <DefaultTooltip
                        title={isLocked ? 'Unlock Sidebar' : 'Lock Sidebar'}
                    >
                        {isLocked ? (
                            <AiFillLock
                                style={controlIconStyle}
                                onClick={toggleLockSidebar}
                            />
                        ) : (
                            <AiFillUnlock
                                style={controlIconStyle}
                                onClick={toggleLockSidebar}
                            />
                        )}
                    </DefaultTooltip>
                    <DefaultTooltip
                        title={openAllDefault ? 'Collapse All' : 'Expand All'}
                    >
                        {openAllDefault ? (
                            <BsChevronContract
                                style={controlIconStyle}
                                onClick={toggleExpandCollapseAll}
                            />
                        ) : (
                            <BsChevronExpand
                                style={controlIconStyle}
                                onClick={toggleExpandCollapseAll}
                            />
                        )}
                    </DefaultTooltip>
                    <DefaultTooltip
                        title={
                            isLocked
                                ? 'Sidebar locked'
                                : sidebar.isOpen
                                ? 'Close Sidebar'
                                : 'Open Sidebar'
                        }
                    >
                        <input
                            type='image'
                            src={closeSidebarImage}
                            alt='close sidebar'
                            onClick={() => sidebar.close(true)}
                            disabled={isLocked}
                            style={{ opacity: isLocked ? 0.5 : 1 }}
                        />
                    </DefaultTooltip>
                </div>
            ) : (
                <BiSearch
                    size={20}
                    className={!sidebar.isOpen && styles.closed}
                    onClick={() => sidebar.open(false)}
                />
            )}
        </div>
    );
    const sidebarRef = useRef<HTMLDivElement>(null);

    const sidebarStyle = sidebar.isOpen
        ? styles.sidebar_active
        : styles.sidebar;

    const regularSidebarDisplay = (
        <div className={styles.sidebar_content_container}>
            {topPoolsSection.map((item, idx) => (
                <SidebarAccordion
                    sidebar={sidebar}
                    shouldDisplayContentWhenUserNotLoggedIn={true}
                    idx={idx}
                    item={item}
                    key={idx}
                    openAllDefault={openAllDefault}
                    isDefaultOverridden={isDefaultOverridden}
                />
            ))}
            {favoritePools.map((item, idx) => (
                <SidebarAccordion
                    sidebar={sidebar}
                    shouldDisplayContentWhenUserNotLoggedIn={true}
                    idx={idx}
                    item={item}
                    key={idx}
                    openAllDefault={openAllDefault}
                    isDefaultOverridden={isDefaultOverridden}
                />
            ))}
            {recentPoolsData.map((item, idx) => (
                <SidebarAccordion
                    sidebar={sidebar}
                    shouldDisplayContentWhenUserNotLoggedIn={true}
                    idx={idx}
                    item={item}
                    key={idx}
                    openAllDefault={openAllDefault}
                    isDefaultOverridden={isDefaultOverridden}
                />
            ))}
            <div style={{ margin: 'auto' }} />
            {recentTransactions.map((item, idx) => (
                <SidebarAccordion
                    sidebar={sidebar}
                    shouldDisplayContentWhenUserNotLoggedIn={false}
                    idx={idx}
                    item={item}
                    key={idx}
                    openAllDefault={openAllDefault}
                    isDefaultOverridden={isDefaultOverridden}
                />
            ))}{' '}
            {recentLimitOrders.map((item, idx) => (
                <SidebarAccordion
                    sidebar={sidebar}
                    shouldDisplayContentWhenUserNotLoggedIn={false}
                    idx={idx}
                    item={item}
                    key={idx}
                    openAllDefault={openAllDefault}
                    isDefaultOverridden={isDefaultOverridden}
                />
            ))}{' '}
            {rangePositions.map((item, idx) => (
                <SidebarAccordion
                    sidebar={sidebar}
                    shouldDisplayContentWhenUserNotLoggedIn={false}
                    idx={idx}
                    item={item}
                    key={idx}
                    openAllDefault={openAllDefault}
                    isDefaultOverridden={isDefaultOverridden}
                />
            ))}
        </div>
    );

    return (
        <div ref={sidebarRef} className={styles.sidebar_container}>
            <nav
                className={`${styles.sidebar} ${sidebarStyle}`}
                onClick={() => {
                    sidebar.isOpen || sidebar.open(false);
                }}
                style={!sidebar.isOpen ? { cursor: 'pointer' } : undefined}
            >
                <div className={styles.sidebar_nav}>
                    {searchContainerDisplay}
                    {searchData.isInputValid && sidebar.isOpen && searchMode ? (
                        <SidebarSearchResults
                            searchData={searchData}
                            cachedPoolStatsFetch={cachedPoolStatsFetch}
                            cachedFetchTokenPrice={cachedFetchTokenPrice}
                        />
                    ) : (
                        regularSidebarDisplay
                    )}
                </div>
            </nav>
        </div>
    );
}

export default memo(Sidebar);
