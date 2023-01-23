import { DetailedHTMLProps, HTMLAttributes, useEffect, useMemo, useState } from 'react';
import { CandleData, CandlesByPoolAndDuration } from '../../../utils/state/graphDataSlice';
import Chart from '../../Chart/Chart';
import './TradeCandleStickChart.css';

// import candleStikPlaceholder from '../../../assets/images/charts/candlestick.png';
import {
    CandleChartData,
    FeeChartData,
    LiqSnap,
    LiquidityData,
    TvlChartData,
    VolumeChartData,
} from './TradeCharts';
import { useAppSelector } from '../../../utils/hooks/reduxToolkit';
import {
    getPinnedPriceValuesFromDisplayPrices,
    getPinnedPriceValuesFromTicks,
} from '../Range/rangeFunctions';
import { lookupChain } from '@crocswap-libs/sdk/dist/context';
import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import { ChainSpec, CrocPoolView } from '@crocswap-libs/sdk';
import ChartSkeleton from './ChartSkeleton/ChartSkeleton';

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'd3fc-group': DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
            'd3fc-svg': DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
        }
    }
}

interface ChartData {
    isUserLoggedIn: boolean | undefined;
    pool: CrocPoolView | undefined;
    chainData: ChainSpec;
    expandTradeTable: boolean;
    // tvlData: any[];
    // volumeData: any[];
    // feeData: any[];
    candleData: CandlesByPoolAndDuration | undefined;
    changeState: (isOpen: boolean | undefined, candleData: CandleData | undefined) => void;
    chartItemStates: chartItemStates;
    limitTick: number;
    liquidityData: any;
    isAdvancedModeActive: boolean | undefined;
    simpleRangeWidth: number | undefined;
    pinnedMinPriceDisplayTruncated: number | undefined;
    pinnedMaxPriceDisplayTruncated: number | undefined;
    truncatedPoolPrice: number | undefined;
    poolPriceDisplay: number | undefined;
    setCurrentData: React.Dispatch<React.SetStateAction<CandleChartData | undefined>>;
    setCurrentVolumeData: React.Dispatch<React.SetStateAction<number | undefined>>;
    upBodyColor: string;
    upBorderColor: string;
    downBodyColor: string;
    downBorderColor: string;
    upVolumeColor: string;
    downVolumeColor: string;
    baseTokenAddress: string;
    chainId: string;
    poolPriceNonDisplay: number | undefined;
    selectedDate: Date | undefined;
    setSelectedDate: React.Dispatch<Date | undefined>;
    rescale: boolean | undefined;
    setRescale: React.Dispatch<React.SetStateAction<boolean>>;
    latest: boolean | undefined;
    setLatest: React.Dispatch<React.SetStateAction<boolean>>;
    reset: boolean | undefined;
    setReset: React.Dispatch<React.SetStateAction<boolean>>;
    showLatest: boolean | undefined;
    activeTimeFrame: string;
    setShowLatest: React.Dispatch<React.SetStateAction<boolean>>;
    setShowTooltip: React.Dispatch<React.SetStateAction<boolean>>;
    handlePulseAnimation: (type: string) => void;
}

export interface ChartUtils {
    period: any;
    bandwidth: any;
    chartData: CandleChartData[];
    tvlChartData: TvlChartData[];
    feeChartData: FeeChartData[];
    volumeChartData: VolumeChartData[];
    poolAdressComb: string;
}

type chartItemStates = {
    showTvl: boolean;
    showVolume: boolean;
    showFeeRate: boolean;
    liqMode: string;
};

export default function TradeCandleStickChart(props: ChartData) {
    const {
        isUserLoggedIn,
        pool,
        chainData,
        baseTokenAddress,
        chainId,
        poolPriceNonDisplay,
        selectedDate,
        setSelectedDate,
        activeTimeFrame,
        handlePulseAnimation,
    } = props;

    const [scaleData, setScaleData] = useState<any>();
    const [liquidityScale, setLiquidityScale] = useState<any>();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isCandleAdded, setIsCandleAdded] = useState<boolean>(false);
    const [parsedChartData, setParsedChartData] = useState<ChartUtils | undefined>(undefined);
    const expandTradeTable = props?.expandTradeTable;

    const tradeData = useAppSelector((state) => state.tradeData);
    const activeChartPeriod = tradeData.activeChartPeriod;

    const tokenPair = {
        dataTokenA: tradeData.tokenA,
        dataTokenB: tradeData.tokenB,
    };

    const denominationsInBase = tradeData.isDenomBase;
    const isTokenABase = tokenPair?.dataTokenA.address === baseTokenAddress;

    const tokenA = tokenPair.dataTokenA;
    const tokenB = tokenPair.dataTokenB;
    const tokenADecimals = tokenA.decimals;
    const tokenBDecimals = tokenB.decimals;
    const baseTokenDecimals = isTokenABase ? tokenADecimals : tokenBDecimals;
    const quoteTokenDecimals = !isTokenABase ? tokenADecimals : tokenBDecimals;

    const currentPoolPriceTick =
        poolPriceNonDisplay === undefined ? 0 : Math.log(poolPriceNonDisplay) / Math.log(1.0001);

    useEffect(() => {
        console.log('firing');
        setIsLoading(true);
        setParsedChartData(() => {
            return undefined;
        });
    }, [activeChartPeriod, denominationsInBase]);

    useEffect(() => {
        parseData();
        console.log('setting candle added to true');
        setIsCandleAdded(true);
    }, [props.candleData]);

    useEffect(() => {
        if (parsedChartData === undefined) {
            console.log('parsing chart data because parsedChartData === undefined');
            parseData();
        }
    }, [parsedChartData]);

    // Parse price data
    const parseData = () => {
        console.log('parsing candle data');

        const chartData: CandleChartData[] = [];
        const tvlChartData: TvlChartData[] = [];
        const volumeChartData: VolumeChartData[] = [];
        const feeChartData: FeeChartData[] = [];

        props.candleData?.candles.map((data) => {
            const close = denominationsInBase
                ? data.invPriceCloseExclMEVDecimalCorrected
                : data.priceCloseExclMEVDecimalCorrected;

            const open = denominationsInBase
                ? data.invPriceOpenExclMEVDecimalCorrected
                : data.priceOpenExclMEVDecimalCorrected;

            chartData.push({
                date: new Date(data.time * 1000),
                open: open,
                close: close,
                high: denominationsInBase
                    ? data.invMinPriceExclMEVDecimalCorrected
                    : data.maxPriceExclMEVDecimalCorrected,
                low: denominationsInBase
                    ? data.invMaxPriceExclMEVDecimalCorrected
                    : data.minPriceExclMEVDecimalCorrected,
                time: data.time,
                allSwaps: [],
                color: close > open ? props.upBodyColor : props.downBodyColor,
                stroke: close > open ? props.upBorderColor : props.downBorderColor,
            });

            tvlChartData.push({
                time: new Date(data.tvlData.time * 1000),
                value: data.tvlData.tvl,
            });

            volumeChartData.push({
                time: new Date(data.time * 1000),
                value: data.volumeUSD,
                color: close > open ? props.upVolumeColor : props.downVolumeColor,
            });

            feeChartData.push({
                time: new Date(data.time * 1000),
                value: data.averageLiquidityFee,
            });
        });

        chartData.sort((a: any, b: any) => b.time - a.time);
        tvlChartData.sort((a: any, b: any) => b.time - a.time);
        volumeChartData.sort((a: any, b: any) => b.time - a.time);
        feeChartData.sort((a: any, b: any) => b.time - a.time);

        const chartUtils: ChartUtils = {
            period: props.candleData?.duration,
            bandwidth: 0,
            chartData: chartData,
            tvlChartData: tvlChartData,
            volumeChartData: volumeChartData,
            feeChartData: feeChartData,
            poolAdressComb: props.candleData?.pool.baseAddress
                ? props.candleData?.pool.baseAddress
                : '' + props.candleData?.pool.quoteAddress,
        };

        setParsedChartData(() => {
            return chartUtils;
        });
    };

    const standardDeviation = (arr: any, usePopulation = false) => {
        const mean = arr.reduce((acc: any, val: any) => acc + val, 0) / arr.length;
        return Math.sqrt(
            arr
                .reduce((acc: any, val: any) => acc.concat((val - mean) ** 2), [])
                .reduce((acc: any, val: any) => acc + val, 0) /
                (arr.length - (usePopulation ? 0 : 1)),
        );
    };

    // volume data

    const volumeData = useMemo(() => {
        const volumeData = parsedChartData?.volumeChartData;
        const volumeTempData: any = [];
        if (volumeData) {
            const volumeLogScale = d3
                .scaleLog()
                .domain([
                    d3.min(volumeData, function (d: any) {
                        return d.value;
                    }),
                    d3.max(parsedChartData?.volumeChartData, function (d: any) {
                        return d.value;
                    }),
                ])
                .range([30, 1000]);

            volumeData.map((data: any) => {
                volumeTempData.push({
                    time: data.time,
                    value: data.value ? volumeLogScale(data.value) : 0,
                    volume: data.value ? data.value : 0,
                    color: data.color,
                });
            });
        }

        return volumeTempData;
    }, [parsedChartData?.volumeChartData, parsedChartData?.period]);

    // Parse liquidtiy data
    const liquidityData = useMemo(() => {
        console.log('firing');
        const liqAskData: LiquidityData[] = [];
        const liqBidData: LiquidityData[] = [];
        const depthLiqBidData: LiquidityData[] = [];
        const depthLiqAskData: LiquidityData[] = [];

        const liqSnapData: LiqSnap[] = [];
        let topBoundary = 0;
        let lowBoundary = 0;

        if (
            props.liquidityData &&
            props.poolPriceDisplay !== undefined &&
            props.poolPriceDisplay > 0
        ) {
            const lowTick = currentPoolPriceTick - 100 * 101;
            const highTick = currentPoolPriceTick + 100 * 101;

            const rangeBoundary = getPinnedPriceValuesFromTicks(
                denominationsInBase,
                baseTokenDecimals,
                quoteTokenDecimals,
                lowTick,
                highTick,
                lookupChain(chainId).gridSize,
            );

            const limitBoundary = parseFloat(rangeBoundary.pinnedMaxPriceDisplay);

            const barThreshold = props.poolPriceDisplay !== undefined ? props.poolPriceDisplay : 0;

            const domainLeft = Math.min(
                ...props.liquidityData.ranges.map((o: any) => {
                    return o.activeLiq !== undefined ? parseFloat(o.activeLiq) : Infinity;
                }),
            );
            const domainRight = Math.max(
                ...props.liquidityData.ranges.map((o: any) => {
                    return o.activeLiq !== undefined ? parseFloat(o.activeLiq) : 0;
                }),
            );

            const depthBidLeft = Math.min(
                ...props.liquidityData.ranges.map((o: any) => {
                    return o.cumBidLiq !== undefined && o.cumBidLiq !== '0'
                        ? parseFloat(o.cumBidLiq)
                        : Infinity;
                }),
            );
            const depthBidRight = Math.max(
                ...props.liquidityData.ranges.map((o: any) => {
                    return o.cumBidLiq !== undefined && o.cumBidLiq !== '0'
                        ? parseFloat(o.cumBidLiq)
                        : 0;
                }),
            );

            const depthAskLeft = Math.min(
                ...props.liquidityData.ranges.map((o: any) => {
                    return o.cumAskLiq !== undefined && o.cumAskLiq !== '0'
                        ? parseFloat(o.cumAskLiq)
                        : Infinity;
                }),
            );
            const depthAskRight = Math.max(
                ...props.liquidityData.ranges.map((o: any) => {
                    const price = denominationsInBase
                        ? o.upperBoundInvPriceDecimalCorrected
                        : o.upperBoundPriceDecimalCorrected;
                    if (price > barThreshold / 10 && price < limitBoundary) {
                        return o.cumAskLiq !== undefined && o.cumAskLiq !== '0'
                            ? parseFloat(o.cumAskLiq)
                            : 0;
                    }
                    return 0;
                }),
            );

            const liquidityScale = d3
                .scaleLog()
                .domain([domainLeft, domainRight])
                .range([30, 1000]);

            const depthLiquidityScale = d3
                .scaleLog()
                .domain([
                    depthAskLeft < depthBidLeft ? depthAskLeft : depthBidLeft,
                    depthBidRight > depthAskRight ? depthBidRight : depthAskRight,
                ])
                .range([1, 550]);

            props.liquidityData.ranges.map((data: any) => {
                const liqPrices = denominationsInBase
                    ? data.upperBoundInvPriceDecimalCorrected
                    : data.upperBoundPriceDecimalCorrected;

                if (liqPrices > barThreshold && liqPrices < barThreshold * 10) {
                    liqBidData.push({
                        activeLiq: liquidityScale(data.activeLiq),
                        liqPrices: liqPrices,
                        deltaAverageUSD: data.deltaAverageUSD ? data.deltaAverageUSD : 0,
                        cumAverageUSD: data.cumAverageUSD ? data.cumAverageUSD : 0,
                    });
                } else {
                    if (liqPrices < limitBoundary && liqPrices > barThreshold / 10) {
                        liqAskData.push({
                            activeLiq: liquidityScale(data.activeLiq),
                            liqPrices: liqPrices,
                            deltaAverageUSD: data.deltaAverageUSD ? data.deltaAverageUSD : 0,
                            cumAverageUSD: data.cumAverageUSD ? data.cumAverageUSD : 0,
                        });
                    }
                }

                if (!denominationsInBase) {
                    if (
                        data.cumAskLiq !== undefined &&
                        data.cumAskLiq !== '0' &&
                        liqPrices !== '+inf' &&
                        !Number.isNaN(depthLiquidityScale(data.cumAskLiq)) &&
                        liqPrices < barThreshold * 10
                    ) {
                        depthLiqBidData.push({
                            activeLiq: depthLiquidityScale(data.cumAskLiq),
                            liqPrices: liqPrices,
                            deltaAverageUSD: data.deltaAverageUSD,
                            cumAverageUSD: data.cumAverageUSD,
                        });
                    }

                    if (
                        data.cumBidLiq !== undefined &&
                        !Number.isNaN(depthLiquidityScale(data.cumBidLiq))
                    ) {
                        depthLiqAskData.push({
                            activeLiq: depthLiquidityScale(data.cumBidLiq),
                            liqPrices: liqPrices,
                            deltaAverageUSD: data.deltaAverageUSD,
                            cumAverageUSD: data.cumAverageUSD,
                        });
                    }
                } else {
                    if (
                        data.cumBidLiq !== undefined &&
                        data.cumBidLiq !== '0' &&
                        liqPrices !== '+inf' &&
                        !Number.isNaN(depthLiquidityScale(data.cumBidLiq))
                    ) {
                        depthLiqBidData.push({
                            activeLiq: depthLiquidityScale(data.cumBidLiq),
                            liqPrices: liqPrices,
                            deltaAverageUSD: data.deltaAverageUSD,
                            cumAverageUSD: data.cumAverageUSD,
                        });
                    }

                    if (
                        data.cumAskLiq !== undefined &&
                        data.cumAskLiq !== '0' &&
                        !Number.isNaN(depthLiquidityScale(data.cumAskLiq)) &&
                        liqPrices < limitBoundary
                    ) {
                        depthLiqAskData.push({
                            activeLiq: depthLiquidityScale(data.cumAskLiq),
                            liqPrices: liqPrices,
                            deltaAverageUSD: data.deltaAverageUSD,
                            cumAverageUSD: data.cumAverageUSD,
                        });
                    }
                }

                const pinnedDisplayPrices = getPinnedPriceValuesFromDisplayPrices(
                    denominationsInBase,
                    baseTokenDecimals,
                    quoteTokenDecimals,
                    data.upperBoundInvPriceDecimalCorrected,
                    data.lowerBoundInvPriceDecimalCorrected,
                    lookupChain(chainId).gridSize,
                );

                if (!isNaN(parseFloat(pinnedDisplayPrices.pinnedMaxPriceDisplayTruncated))) {
                    liqSnapData.push({
                        activeLiq: data.activeLiq,
                        pinnedMaxPriceDisplayTruncated: parseFloat(
                            pinnedDisplayPrices.pinnedMaxPriceDisplayTruncated,
                        ),
                        pinnedMinPriceDisplayTruncated: parseFloat(
                            pinnedDisplayPrices.pinnedMinPriceDisplayTruncated,
                        ),
                    });
                }
            });
            if (liqBidData.length > 1 && liqAskData.length > 1) {
                liqBidData.sort((a: any, b: any) => b.liqPrices - a.liqPrices);

                liqAskData.sort((a: any, b: any) => b.liqPrices - a.liqPrices);

                const liqAllAskPrices = liqAskData.map(({ liqPrices }) => liqPrices);
                const liqAskDeviation = standardDeviation(liqAllAskPrices);

                const liqAllBidPrices = liqBidData.map(({ liqPrices }) => liqPrices);
                const liqBidDeviation = standardDeviation(liqAllBidPrices);

                liqBidData.push({
                    activeLiq: liqBidData[liqBidData.length - 1].activeLiq,
                    liqPrices: barThreshold,
                    deltaAverageUSD: 0,
                    cumAverageUSD: 0,
                });

                console.log(liqBidData[0].liqPrices, limitBoundary, liqBidDeviation);

                while (liqBidData[0].liqPrices < limitBoundary) {
                    liqBidData.unshift({
                        activeLiq: liqBidData[0].activeLiq,
                        liqPrices: liqBidData[0].liqPrices + liqBidDeviation,
                        deltaAverageUSD: 0,
                        cumAverageUSD: 0,
                    });
                }

                liqBidData.push({
                    activeLiq: liqBidData.find((liqData) => liqData.liqPrices < limitBoundary)
                        ?.activeLiq,
                    liqPrices: limitBoundary,
                    deltaAverageUSD: 0,
                    cumAverageUSD: 0,
                });

                liqAskData.unshift({
                    activeLiq: liqAskData[0].activeLiq,
                    liqPrices: barThreshold,
                    deltaAverageUSD: 0,
                    cumAverageUSD: 0,
                });

                while (liqAskData[liqAskData.length - 1].liqPrices - liqAskDeviation > 0) {
                    liqAskData.push({
                        activeLiq: liqAskData[liqAskData.length - 1].activeLiq,
                        liqPrices:
                            liqAskData[liqAskData.length - 1].liqPrices - liqAskDeviation / 2,
                        deltaAverageUSD: 0,
                        cumAverageUSD: 0,
                    });
                }

                liqAskData.push({
                    activeLiq: liqAskData[liqAskData.length - 1].activeLiq,
                    liqPrices: 0,
                    deltaAverageUSD: 0,
                    cumAverageUSD: 0,
                });

                while (
                    depthLiqAskData[depthLiqAskData.length - 1].liqPrices - liqAskDeviation >
                    0
                ) {
                    depthLiqAskData.push({
                        activeLiq: depthLiqAskData[depthLiqAskData.length - 1].activeLiq,
                        liqPrices:
                            depthLiqAskData[depthLiqAskData.length - 1].liqPrices -
                            liqAskDeviation / 2,
                        deltaAverageUSD: 0,
                        cumAverageUSD: 0,
                    });
                }

                depthLiqAskData.push({
                    activeLiq: depthLiqAskData[depthLiqAskData.length - 1].activeLiq,
                    liqPrices: 0,
                    deltaAverageUSD: 0,
                    cumAverageUSD: 0,
                });
            }
            topBoundary = limitBoundary;
            lowBoundary = parseFloat(rangeBoundary.pinnedMinPriceDisplay);
        }

        liqAskData.sort((a: any, b: any) => b.liqPrices - a.liqPrices);
        liqBidData.sort((a: any, b: any) => b.liqPrices - a.liqPrices);
        depthLiqBidData.sort((a: any, b: any) => b.liqPrices - a.liqPrices);
        depthLiqAskData.sort((a: any, b: any) => b.liqPrices - a.liqPrices);

        return {
            liqAskData: liqAskData,
            liqBidData: liqBidData,
            depthLiqBidData: depthLiqBidData,
            depthLiqAskData: depthLiqAskData,
            liqSnapData: liqSnapData,
            liqHighligtedAskSeries: [],
            liqHighligtedBidSeries: [],
            lineBidSeries: [],
            lineAskSeries: [],
            totalLiq: props.liquidityData?.totals?.totalLiq,
            topBoundary: topBoundary,
            lowBoundary: lowBoundary,
        };
    }, [JSON.stringify(props.liquidityData), props.poolPriceDisplay]);

    useEffect(() => {
        console.log('firing');
        setScaleData(() => {
            return undefined;
        });
        setScaleForChart(parsedChartData);
    }, [parsedChartData?.period]);

    // Liq Scale
    useEffect(() => {
        setLiquidityScale(() => {
            return undefined;
        });
        setScaleForChartLiquidity(liquidityData);
    }, [JSON.stringify(liquidityData)]);

    const setScaleForChartLiquidity = (liquidityData: any) => {
        if (liquidityData !== undefined) {
            const liquidityScale = d3.scaleLinear();

            const liquidityExtent = d3fc
                .extentLinear(liquidityData.liqBidData.concat(liquidityData.liqAskData))
                .include([0])
                .accessors([(d: any) => parseFloat(d.activeLiq)]);

            liquidityScale.domain(
                liquidityExtent(liquidityData.liqBidData.concat(liquidityData.liqAskData)),
            );

            setLiquidityScale(() => liquidityScale);
        }
    };

    // Scale
    const setScaleForChart = (parsedChartData: any) => {
        if (parsedChartData !== undefined) {
            const temp = [...parsedChartData.chartData];
            const boundaryCandles = temp.splice(0, 99);

            const priceRange = d3fc
                .extentLinear()
                .accessors([(d: any) => d.high, (d: any) => d.low])
                .pad([0.05, 0.05]);

            const xExtent = d3fc
                .extentDate()
                .accessors([(d: any) => d.date])
                .padUnit('domain')
                // ensure that the scale is padded by one day in either direction
                .pad([parsedChartData.period * 1000, (parsedChartData.period / 2) * 80000]);

            const subChartxExtent = d3fc
                .extentDate()
                .accessors([(d: any) => d.date])
                .padUnit('domain')
                // ensure that the scale is padded by one day in either direction
                .pad([parsedChartData.period * 3000, (parsedChartData.period / 2) * 100000]);

            const xScale = d3.scaleTime();
            const subChartxScale = d3.scaleTime();
            const yScale = d3.scaleLinear();

            xScale.domain(xExtent(boundaryCandles));
            subChartxScale.domain(subChartxExtent(parsedChartData.chartData));
            yScale.domain(priceRange(boundaryCandles));

            const xScaleCopy = xScale.copy();
            const yScaleCopy = yScale.copy();

            const yScaleIndicator = yScale.copy();
            const xScaleIndicator = xScale.copy();

            const ghostScale = d3.scaleLinear();

            const volumeScale = d3.scaleLinear();

            const yExtentVolume = d3fc
                .extentLinear(volumeData)
                .include([0])
                .accessors([(d: any) => d.value])
                .pad([0.05, 0.05]);

            volumeScale.domain(yExtentVolume(volumeData));

            // bar chart
            const ghostExtent = d3fc
                .extentLinear(liquidityData.liqSnapData)
                .include([0])
                .accessors([(d: any) => parseFloat(d.activeLiq)]);

            ghostScale.domain(ghostExtent(liquidityData.liqSnapData));

            setScaleData(() => {
                return {
                    xScale: xScale,
                    yScale: yScale,
                    yScaleIndicator: yScaleIndicator,
                    xScaleIndicator: xScaleIndicator,
                    xScaleCopy: xScaleCopy,
                    yScaleCopy: yScaleCopy,
                    ghostScale: ghostScale,
                    subChartxScale: subChartxScale,
                    volumeScale: volumeScale,
                    lastDragedY: 0,
                    xExtent: xExtent,
                };
            });
        }
    };

    const loading = (
        <div style={{ height: '100%', width: '100%' }} className='animatedImg_container'>
            {/* <img src={candleStikPlaceholder} className='img_shimmer' /> */}
            {/* <PulseLoading/> */}
            <ChartSkeleton />
            <div className='fetching_text'>Fetching chart data...</div>
        </div>
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            const shouldReload =
                scaleData === undefined ||
                // parsedChartData === undefined ||
                parsedChartData?.chartData.length === 0 ||
                props.poolPriceDisplay === 0 ||
                liquidityData.liqAskData.length === 0 ||
                liquidityData.liqBidData.length === 0 ||
                poolPriceNonDisplay === 0;
            if (isLoading !== shouldReload) {
                console.log('setting isLoading to ' + shouldReload);
                setIsLoading(shouldReload);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [
        parsedChartData?.chartData.length,
        props.poolPriceDisplay,
        poolPriceNonDisplay,
        scaleData === undefined,
        liquidityScale,
    ]);

    return (
        <>
            <div style={{ height: '100%', width: '100%' }}>
                {!isLoading && parsedChartData !== undefined ? (
                    <Chart
                        isUserLoggedIn={isUserLoggedIn}
                        pool={pool}
                        chainData={chainData}
                        isTokenABase={isTokenABase}
                        candleData={parsedChartData}
                        expandTradeTable={expandTradeTable}
                        liquidityData={liquidityData}
                        volumeData={volumeData}
                        changeState={props.changeState}
                        limitTick={props.limitTick}
                        denomInBase={denominationsInBase}
                        isAdvancedModeActive={props.isAdvancedModeActive}
                        simpleRangeWidth={props.simpleRangeWidth}
                        pinnedMinPriceDisplayTruncated={props.pinnedMinPriceDisplayTruncated}
                        pinnedMaxPriceDisplayTruncated={props.pinnedMaxPriceDisplayTruncated}
                        poolPriceDisplay={props.poolPriceDisplay}
                        truncatedPoolPrice={props.truncatedPoolPrice}
                        chartItemStates={props.chartItemStates}
                        setCurrentData={props.setCurrentData}
                        setCurrentVolumeData={props.setCurrentVolumeData}
                        upBodyColor={props.upBodyColor}
                        upBorderColor={props.upBorderColor}
                        downBodyColor={props.downBodyColor}
                        downBorderColor={props.downBorderColor}
                        isCandleAdded={isCandleAdded}
                        setIsCandleAdded={setIsCandleAdded}
                        scaleData={scaleData}
                        chainId={chainId}
                        poolPriceNonDisplay={poolPriceNonDisplay}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        rescale={props.rescale}
                        setRescale={props.setRescale}
                        latest={props.latest}
                        setLatest={props.setLatest}
                        reset={props.reset}
                        setReset={props.setReset}
                        showLatest={props.showLatest}
                        setShowLatest={props.setShowLatest}
                        setShowTooltip={props.setShowTooltip}
                        activeTimeFrame={activeTimeFrame}
                        liquidityScale={liquidityScale}
                        handlePulseAnimation={handlePulseAnimation}
                    />
                ) : (
                    <>{loading}</>
                )}
            </div>
        </>
    );
}
