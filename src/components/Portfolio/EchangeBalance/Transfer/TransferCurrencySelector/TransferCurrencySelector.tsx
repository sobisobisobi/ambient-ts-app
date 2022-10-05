import styles from './TransferCurrencySelector.module.css';
import { RiArrowDownSLine } from 'react-icons/ri';
import { TokenIF } from '../../../../../utils/interfaces/TokenIF';
import { Dispatch, SetStateAction } from 'react';

interface TransferCurrencySelectorProps {
    fieldId: string;
    onClick: () => void;

    sellToken?: boolean;
    disable?: boolean;
    tempTokenSelection: TokenIF;
    setTransferQty: Dispatch<SetStateAction<number | undefined>>; // updateOtherQuantity: (evt: ChangeEvent<HTMLInputElement>) => void;
}

export default function TransferCurrencySelector(props: TransferCurrencySelectorProps) {
    const { fieldId, disable, onClick, tempTokenSelection, setTransferQty } = props;

    const rateInput = (
        <div className={styles.token_amount}>
            <input
                id={`${fieldId}-exchange-balance-transfer-quantity`}
                className={styles.currency_quantity}
                placeholder='0'
                onChange={(event) => {
                    setTransferQty(parseFloat(event.target.value));
                }}
                type='string'
                inputMode='decimal'
                autoComplete='off'
                autoCorrect='off'
                min='0'
                minLength={1}
                pattern='^[0-9]*[.,]?[0-9]*$'
                disabled={disable}
                required
            />
        </div>
    );

    return (
        <div className={styles.swapbox}>
            <span className={styles.direction}>Select Token</span>
            <div className={styles.swapbox_top}>
                <div className={styles.swap_input}>{rateInput}</div>
                <div className={styles.token_select} onClick={onClick}>
                    <img
                        className={styles.token_list_img}
                        src={tempTokenSelection.logoURI}
                        alt={tempTokenSelection.name}
                        width='30px'
                    />
                    <span className={styles.token_list_text}>{tempTokenSelection.symbol}</span>
                    <RiArrowDownSLine size={27} />
                </div>
            </div>
        </div>
    );
}
