export const CHECKOUT_DART_OPTIONS = [1, 2, 3] as const;

export type CheckoutDartCount = typeof CHECKOUT_DART_OPTIONS[number];

const MAX_BOARD_NUMBER = 20;
const OUTER_BULL_SCORE = 25;
const DOUBLE_BULL_SCORE = 50;
const MISS_SCORE = 0;

function range(start: number, end: number) {
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

const BOARD_NUMBERS = range(1, MAX_BOARD_NUMBER);

const SCORING_DART_SCORES = Array.from(new Set([
    // Misses still consume darts, so zero-score setup darts are legal before the final double.
    MISS_SCORE,
    ...BOARD_NUMBERS,
    OUTER_BULL_SCORE,
    ...BOARD_NUMBERS.map((number) => number * 2),
    ...BOARD_NUMBERS.map((number) => number * 3),
    DOUBLE_BULL_SCORE,
])).sort((a, b) => a - b);

const FINISHING_DOUBLE_SCORES = Array.from(new Set([
    ...BOARD_NUMBERS.map((number) => number * 2),
    DOUBLE_BULL_SCORE,
])).sort((a, b) => a - b);

function isCheckoutDartCount(dartsCount: number): dartsCount is CheckoutDartCount {
    return CHECKOUT_DART_OPTIONS.includes(dartsCount as CheckoutDartCount);
}

function canCheckoutExactly(remainingScore: number, dartsCount: CheckoutDartCount): boolean {
    if (dartsCount === 1) {
        return FINISHING_DOUBLE_SCORES.includes(remainingScore);
    }

    for (const dartScore of SCORING_DART_SCORES) {
        const nextRemainingScore = remainingScore - dartScore;

        if (nextRemainingScore < 2) {
            continue;
        }

        if (canCheckoutExactly(nextRemainingScore, (dartsCount - 1) as CheckoutDartCount)) {
            return true;
        }
    }

    return false;
}

export function getAllowedCheckoutDarts(remainingScore: number): CheckoutDartCount[] {
    if (!Number.isInteger(remainingScore) || remainingScore < 2) {
        return [];
    }

    return CHECKOUT_DART_OPTIONS.filter((dartsCount) => canCheckoutExactly(remainingScore, dartsCount));
}

export function isAllowedCheckoutDarts(remainingScore: number, dartsCount: number): dartsCount is CheckoutDartCount {
    return isCheckoutDartCount(dartsCount) && getAllowedCheckoutDarts(remainingScore).includes(dartsCount);
}
