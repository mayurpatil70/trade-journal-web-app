/**
 * Checks if a candle hits the stop loss or take profit for an open trade.
 * 
 * @param {Object} candle - The current candle { time, open, high, low, close }
 * @param {Object} trade - The open trade { type: 'Buy' | 'Sell', entryPrice, sl, tp }
 * @param {number} positionSize - The simulated position size in USD
 * @returns {Object|null} - Returns the closed trade result, or null if trade remains open
 */
export function checkTradeExit(candle, trade, positionSize = 1000) {
    let closed = false;
    let pnl = 0;
    let exitPrice = 0;

    if (trade.type === 'Buy') {
        if (candle.low <= trade.sl) {
            closed = true;
            exitPrice = trade.sl;
            pnl = - (trade.entryPrice - trade.sl);
        } else if (candle.high >= trade.tp) {
            closed = true;
            exitPrice = trade.tp;
            pnl = (trade.tp - trade.entryPrice);
        }
    } else if (trade.type === 'Sell') {
        if (candle.high >= trade.sl) {
            closed = true;
            exitPrice = trade.sl;
            pnl = - (trade.sl - trade.entryPrice);
        } else if (candle.low <= trade.tp) {
            closed = true;
            exitPrice = trade.tp;
            pnl = (trade.entryPrice - trade.tp);
        }
    }

    if (closed) {
        const profitPercentage = pnl / trade.entryPrice;
        const finalPnl = positionSize * profitPercentage;

        return {
            ...trade,
            exitPrice,
            finalPnl,
            closedAt: candle.time
        };
    }

    return null;
}
