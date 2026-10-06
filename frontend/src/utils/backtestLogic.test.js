import { describe, it, expect } from 'vitest';
import { checkTradeExit } from './backtestLogic';

describe('Backtest Logic', () => {
    it('should close a Buy trade when Stop Loss is hit', () => {
        const trade = {
            type: 'Buy',
            entryPrice: 50000,
            sl: 49000,
            tp: 52000
        };
        const candle = { low: 48500, high: 50500, time: 1234567890 };
        
        const result = checkTradeExit(candle, trade, 1000);
        
        expect(result).not.toBeNull();
        expect(result.exitPrice).toBe(49000);
        expect(result.finalPnl).toBeLessThan(0);
    });

    it('should close a Buy trade when Take Profit is hit', () => {
        const trade = {
            type: 'Buy',
            entryPrice: 50000,
            sl: 49000,
            tp: 52000
        };
        const candle = { low: 50100, high: 52500, time: 1234567891 };
        
        const result = checkTradeExit(candle, trade, 1000);
        
        expect(result).not.toBeNull();
        expect(result.exitPrice).toBe(52000);
        expect(result.finalPnl).toBeGreaterThan(0);
    });

    it('should leave trade open if neither SL nor TP is hit', () => {
        const trade = {
            type: 'Buy',
            entryPrice: 50000,
            sl: 49000,
            tp: 52000
        };
        const candle = { low: 49500, high: 51000, time: 1234567892 };
        
        const result = checkTradeExit(candle, trade, 1000);
        
        expect(result).toBeNull();
    });

    it('should close a Sell trade when Stop Loss is hit', () => {
        const trade = {
            type: 'Sell',
            entryPrice: 50000,
            sl: 51000,
            tp: 48000
        };
        const candle = { low: 49500, high: 51500, time: 1234567893 };
        
        const result = checkTradeExit(candle, trade, 1000);
        
        expect(result).not.toBeNull();
        expect(result.exitPrice).toBe(51000);
        expect(result.finalPnl).toBeLessThan(0);
    });
    
    it('should close a Sell trade when Take Profit is hit', () => {
        const trade = {
            type: 'Sell',
            entryPrice: 50000,
            sl: 51000,
            tp: 48000
        };
        const candle = { low: 47500, high: 49500, time: 1234567894 };
        
        const result = checkTradeExit(candle, trade, 1000);
        
        expect(result).not.toBeNull();
        expect(result.exitPrice).toBe(48000);
        expect(result.finalPnl).toBeGreaterThan(0);
    });
});
