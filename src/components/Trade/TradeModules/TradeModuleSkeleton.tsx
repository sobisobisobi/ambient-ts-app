import { motion } from 'framer-motion';
import { useContext, useState, useMemo } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { useTradeData } from '../../../App/hooks/useTradeData';
import { AppStateContext } from '../../../contexts/AppStateContext';
import { CrocEnvContext } from '../../../contexts/CrocEnvContext';
import { TokenContext } from '../../../contexts/TokenContext';
import { FlexContainer, GridContainer } from '../../../styled/Common';
import {
    AcknowledgeLink,
    AcknowledgeText,
} from '../../../styled/Components/TradeModules';
import { TutorialButton } from '../../../styled/Components/Tutorial';
import { useAppSelector } from '../../../utils/hooks/reduxToolkit';
import { ConnectWalletButton } from '../../Global/Button/ConnectWalletButton';
import ContentContainer from '../../Global/ContentContainer/ContentContainer';
import TutorialOverlay from '../../Global/TutorialOverlay/TutorialOverlay';

interface PropsIF {
    header: React.ReactNode;
    input: React.ReactNode;
    transactionDetails: React.ReactNode;
    modal: React.ReactNode | undefined;
    button: React.ReactNode;
    bypassConfirm: React.ReactNode | undefined;
    approveButton: React.ReactNode | undefined;
    warnings?: React.ReactNode | undefined;
    // eslint-disable-next-line
    tutorialSteps: any;
    isSwapPage?: boolean;
    inputOptions?: React.ReactNode;
}

export const TradeModuleSkeleton = (props: PropsIF) => {
    const {
        isSwapPage,
        header,
        input,
        inputOptions,
        transactionDetails,
        modal,
        button,
        bypassConfirm,
        approveButton,
        warnings,
        tutorialSteps,
    } = props;

    const {
        tutorial: { isActive: isTutorialActive },
        wagmiModal: { open: openWagmiModal },
    } = useContext(AppStateContext);
    const {
        chainData: { blockExplorer },
    } = useContext(CrocEnvContext);
    const { tokens } = useContext(TokenContext);

    const { isLoggedIn: isUserConnected } = useAppSelector(
        (state) => state.userData,
    );
    const { tokenA, tokenB } = useAppSelector((state) => state.tradeData);
    const navigationMenu = !isSwapPage ? useTradeData().navigationMenu : null;

    const [isTutorialEnabled, setIsTutorialEnabled] = useState(false);

    // values if either token needs to be confirmed before transacting
    const needConfirmTokenA = !tokens.verify(tokenA.address);
    const needConfirmTokenB = !tokens.verify(tokenB.address);
    // token acknowledgement needed message (empty string if none needed)
    const ackTokenMessage = useMemo<string>(() => {
        // !Important   any changes to verbiage in this code block must be approved
        // !Important   ... by Doug, get in writing by email or request specific
        // !Important   ... review for a pull request on GitHub
        let text: string;
        if (needConfirmTokenA && needConfirmTokenB) {
            text = `The tokens ${tokenA.symbol || tokenA.name} and ${
                tokenB.symbol || tokenB.name
            } are not listed on any major reputable token list. Please be sure these are the actual tokens you want to trade. Many fraudulent tokens will use the same name and symbol as other major tokens. Always conduct your own research before trading.`;
        } else if (needConfirmTokenA) {
            text = `The token ${
                tokenA.symbol || tokenA.name
            } is not listed on any major reputable token list. Please be sure this is the actual token you want to trade. Many fraudulent tokens will use the same name and symbol as other major tokens. Always conduct your own research before trading.`;
        } else if (needConfirmTokenB) {
            text = `The token ${
                tokenB.symbol || tokenB.name
            } is not listed on any major reputable token list. Please be sure this is the actual token you want to trade. Many fraudulent tokens will use the same name and symbol as other major tokens. Always conduct your own research before trading.`;
        } else {
            text = '';
        }
        return text;
    }, [needConfirmTokenA, needConfirmTokenB]);

    const formattedAckTokenMessage = ackTokenMessage.replace(
        /\b(not)\b/g,
        '<span style="color: var(--negative); text-transform: uppercase;">$1</span>',
    );

    return (
        <section>
            {isTutorialActive && (
                <FlexContainer
                    fullWidth
                    justifyContent='flex-end'
                    alignItems='flex-end'
                    padding='0 8px'
                >
                    <TutorialButton onClick={() => setIsTutorialEnabled(true)}>
                        Tutorial Mode
                    </TutorialButton>
                </FlexContainer>
            )}{' '}
            <ContentContainer isOnTradeRoute={!isSwapPage}>
                {header}
                {navigationMenu}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {input}
                </motion.div>
                {inputOptions && inputOptions}
                <FlexContainer
                    flexDirection='column'
                    gap={8}
                    margin='8px 0 0 0'
                    padding='0 32px'
                >
                    {transactionDetails}
                    {isUserConnected === undefined ? null : isUserConnected ===
                      true ? (
                        approveButton ? (
                            approveButton
                        ) : (
                            <>
                                {!bypassConfirm ? button : bypassConfirm}
                                {ackTokenMessage && (
                                    // NO
                                    <AcknowledgeText
                                        fontSize='body'
                                        dangerouslySetInnerHTML={{
                                            __html: formattedAckTokenMessage,
                                        }}
                                    ></AcknowledgeText>
                                )}
                                {needConfirmTokenA ||
                                    (needConfirmTokenB && (
                                        <GridContainer
                                            numCols={2}
                                            gap={16}
                                            margin='4px 0'
                                        >
                                            {needConfirmTokenA && (
                                                <AcknowledgeLink
                                                    href={
                                                        blockExplorer +
                                                        'token/' +
                                                        tokenA.address
                                                    }
                                                    rel={'noopener noreferrer'}
                                                    target='_blank'
                                                    aria-label={`approve ${tokenA.symbol}`}
                                                >
                                                    {tokenA.symbol ||
                                                        tokenA.name}{' '}
                                                    <FiExternalLink />
                                                </AcknowledgeLink>
                                            )}
                                            {needConfirmTokenB && (
                                                <a
                                                    href={
                                                        blockExplorer +
                                                        'token/' +
                                                        tokenB.address
                                                    }
                                                    rel={'noopener noreferrer'}
                                                    target='_blank'
                                                    aria-label={`approve ${tokenB.symbol}`}
                                                >
                                                    {tokenB.symbol ||
                                                        tokenB.name}{' '}
                                                    <FiExternalLink />
                                                </a>
                                            )}
                                        </GridContainer>
                                    ))}
                            </>
                        )
                    ) : (
                        <ConnectWalletButton onClick={openWagmiModal} />
                    )}
                    {warnings && warnings}
                </FlexContainer>
            </ContentContainer>
            {modal}
            <TutorialOverlay
                isTutorialEnabled={isTutorialEnabled}
                setIsTutorialEnabled={setIsTutorialEnabled}
                steps={tutorialSteps}
            />
        </section>
    );
};
