import { ChangeEvent, SetStateAction, useEffect, useState } from 'react';
import styles from './CurrencyConverter.module.css';
import CurrencySelector from '../CurrencySelector/CurrencySelector';
import { TokenIF, TokenPairIF } from '../../../utils/interfaces/exports';
import {
    setAddressTokenA,
    setAddressTokenB,
    setIsTokenAPrimary,
    setPrimaryQuantity,
} from '../../../utils/state/tradeDataSlice';
import { useAppDispatch, useAppSelector } from '../../../utils/hooks/reduxToolkit';
import truncateDecimals from '../../../utils/data/truncateDecimals';

interface CurrencyConverterPropsIF {
    isSellTokenBase: boolean;
    tokenPair: TokenPairIF;
    tokensBank: Array<TokenIF>;
    chainId: string;
    isLiq: boolean;
    poolPriceDisplay: number;
    isTokenAPrimary: boolean;
    setIsTokenAPrimary: React.Dispatch<SetStateAction<boolean>>;
    nativeBalance: string;
    tokenABalance: string;
    tokenBBalance: string;
    tokenAInputQty: string;
    tokenBInputQty: string;
    setTokenAInputQty: React.Dispatch<React.SetStateAction<string>>;
    setTokenBInputQty: React.Dispatch<React.SetStateAction<string>>;
    isWithdrawFromDexChecked: boolean;
    setIsWithdrawFromDexChecked: React.Dispatch<SetStateAction<boolean>>;
    isWithdrawToWalletChecked: boolean;
    setIsWithdrawToWalletChecked: React.Dispatch<SetStateAction<boolean>>;
    setSwapAllowed: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function CurrencyConverter(props: CurrencyConverterPropsIF) {
    const {
        tokenPair,
        isSellTokenBase,
        tokensBank,
        chainId,
        isLiq,
        poolPriceDisplay,
        // isTokenAPrimary,
        // setIsTokenAPrimary,
        isWithdrawFromDexChecked,
        setIsWithdrawFromDexChecked,
        isWithdrawToWalletChecked,
        setIsWithdrawToWalletChecked,
        setSwapAllowed,
        tokenABalance,
        tokenBBalance,
        // setTokenAInputQty,
        // setTokenBInputQty,
        // tokenAInputQty,
        // tokenBInputQty,
    } = props;

    // TODO: update name of functions with 'handle' verbiage
    // TODO: consolidate functions into a single function
    // TODO: refactor functions to consider which token is base

    const dispatch = useAppDispatch();

    const tradeData = useAppSelector((state) => state.tradeData);

    const [isTokenAPrimaryLocal, setIsTokenAPrimaryLocal] = useState<boolean>(
        tradeData.isTokenAPrimary,
    );
    const [tokenAQtyLocal, setTokenAQtyLocal] = useState<string>('');
    const [tokenBQtyLocal, setTokenBQtyLocal] = useState<string>('');

    const tokenADecimals = tokenPair.dataTokenA.decimals;
    const tokenBDecimals = tokenPair.dataTokenB.decimals;

    useEffect(() => {
        if (tradeData) {
            if (tradeData.isTokenAPrimary) {
                setTokenAQtyLocal(tradeData.primaryQuantity);
                const sellQtyField = document.getElementById('sell-quantity') as HTMLInputElement;
                if (sellQtyField) {
                    sellQtyField.value =
                        tradeData.primaryQuantity === 'NaN' ? '' : tradeData.primaryQuantity;
                }
            } else {
                setTokenBQtyLocal(tradeData.primaryQuantity);
                const buyQtyField = document.getElementById('buy-quantity') as HTMLInputElement;
                if (buyQtyField) {
                    buyQtyField.value =
                        tradeData.primaryQuantity === 'NaN' ? '' : tradeData.primaryQuantity;
                }
            }
        }
    }, []);

    const handleArrowClick = (): void => {
        reverseTokens();
    };

    const reverseTokens = (): void => {
        if (tokenPair) {
            dispatch(setAddressTokenA(tokenPair.dataTokenB.address));
            dispatch(setAddressTokenB(tokenPair.dataTokenA.address));
        }
        if (!isTokenAPrimaryLocal) {
            setTokenAQtyLocal(tokenBQtyLocal);
            const sellQtyField = document.getElementById('sell-quantity') as HTMLInputElement;
            if (sellQtyField) {
                sellQtyField.value = tokenBQtyLocal === 'NaN' ? '' : tokenBQtyLocal;
            }
        } else {
            setTokenBQtyLocal(tokenAQtyLocal);
            const buyQtyField = document.getElementById('buy-quantity') as HTMLInputElement;
            if (buyQtyField) {
                buyQtyField.value = tokenAQtyLocal === 'NaN' ? '' : tokenAQtyLocal;
            }
        }
        setIsTokenAPrimaryLocal(!isTokenAPrimaryLocal);
        dispatch(setIsTokenAPrimary(!isTokenAPrimaryLocal));
    };

    useEffect(() => {
        isTokenAPrimaryLocal ? handleTokenAChangeEvent() : handleTokenBChangeEvent();
    }, [poolPriceDisplay, isSellTokenBase, isTokenAPrimaryLocal]);

    const handleTokenAChangeEvent = (evt?: ChangeEvent<HTMLInputElement>) => {
        let rawTokenBQty;

        if (evt) {
            const input = evt.target.value;
            setTokenAQtyLocal(input);
            setIsTokenAPrimaryLocal(true);
            dispatch(setIsTokenAPrimary(true));
            dispatch(setPrimaryQuantity(input));

            rawTokenBQty = isSellTokenBase
                ? (1 / poolPriceDisplay) * parseFloat(input)
                : poolPriceDisplay * parseFloat(input);
        } else {
            rawTokenBQty = isSellTokenBase
                ? (1 / poolPriceDisplay) * parseFloat(tokenAQtyLocal)
                : poolPriceDisplay * parseFloat(tokenAQtyLocal);
        }
        const truncatedTokenBQty = truncateDecimals(rawTokenBQty, tokenBDecimals).toString();

        setTokenBQtyLocal(truncatedTokenBQty);
        const buyQtyField = document.getElementById('buy-quantity') as HTMLInputElement;

        if (buyQtyField) {
            buyQtyField.value = truncatedTokenBQty === 'NaN' ? '' : truncatedTokenBQty;
        }
        if (truncatedTokenBQty !== 'NaN' && parseFloat(truncatedTokenBQty) > 0) {
            setSwapAllowed(true);
        } else {
            setSwapAllowed(false);
        }
    };
    const handleTokenBChangeEvent = (evt?: ChangeEvent<HTMLInputElement>) => {
        let rawTokenAQty;

        if (evt) {
            const input = evt.target.value;
            setTokenBQtyLocal(input);
            setIsTokenAPrimaryLocal(false);
            dispatch(setIsTokenAPrimary(false));
            dispatch(setPrimaryQuantity(input));

            rawTokenAQty = isSellTokenBase
                ? poolPriceDisplay * parseFloat(input)
                : (1 / poolPriceDisplay) * parseFloat(input);
        } else {
            rawTokenAQty = isSellTokenBase
                ? poolPriceDisplay * parseFloat(tokenBQtyLocal)
                : (1 / poolPriceDisplay) * parseFloat(tokenBQtyLocal);
        }

        const truncatedTokenAQty = truncateDecimals(rawTokenAQty, tokenADecimals).toString();

        setTokenAQtyLocal(truncatedTokenAQty);
        const sellQtyField = document.getElementById('sell-quantity') as HTMLInputElement;
        if (sellQtyField) {
            sellQtyField.value = truncatedTokenAQty === 'NaN' ? '' : truncatedTokenAQty;
        }
        if (truncatedTokenAQty !== 'NaN' && parseFloat(truncatedTokenAQty) > 0) {
            setSwapAllowed(true);
        } else {
            setSwapAllowed(false);
        }
    };

    return (
        <section className={styles.currency_converter}>
            <CurrencySelector
                tokenPair={tokenPair}
                tokensBank={tokensBank}
                chainId={chainId}
                direction={isLiq ? 'Select Pair' : 'From:'}
                fieldId='sell'
                sellToken
                handleChangeEvent={handleTokenAChangeEvent}
                nativeBalance={props.nativeBalance}
                tokenABalance={tokenABalance}
                tokenBBalance={tokenBBalance}
                isWithdrawFromDexChecked={isWithdrawFromDexChecked}
                setIsWithdrawFromDexChecked={setIsWithdrawFromDexChecked}
                isWithdrawToWalletChecked={isWithdrawToWalletChecked}
                setIsWithdrawToWalletChecked={setIsWithdrawToWalletChecked}
                reverseTokens={reverseTokens}
            />
            <div className={styles.arrow_container} onClick={handleArrowClick}>
                {isLiq ? null : <span className={styles.arrow} />}
            </div>
            <CurrencySelector
                tokenPair={tokenPair}
                tokensBank={tokensBank}
                chainId={chainId}
                direction={isLiq ? '' : 'To:'}
                fieldId='buy'
                handleChangeEvent={handleTokenBChangeEvent}
                nativeBalance={props.nativeBalance}
                tokenABalance={tokenABalance}
                tokenBBalance={tokenBBalance}
                isWithdrawFromDexChecked={isWithdrawFromDexChecked}
                setIsWithdrawFromDexChecked={setIsWithdrawFromDexChecked}
                isWithdrawToWalletChecked={isWithdrawToWalletChecked}
                reverseTokens={reverseTokens}
                setIsWithdrawToWalletChecked={setIsWithdrawToWalletChecked}
            />
        </section>
    );
}
