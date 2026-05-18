/** Convert stored seconds to a display value in the chosen unit. */
export function secondsToDisplay(secs: number | undefined, unit: 's' | 'min'): number | undefined {
    if (secs == null) return undefined
    return unit === 'min' ? Math.round(secs / 60 * 100) / 100 : secs
}

/** Convert a user-entered display value back to seconds. */
export function displayToSeconds(val: number | undefined, unit: 's' | 'min'): number | undefined {
    if (val == null || isNaN(val as number)) return undefined
    return unit === 'min' ? Math.round((val as number) * 60) : (val as number)
}

/** Auto-detect whether a duration value should be displayed in minutes. */
export function autoUnit(secs: number): 's' | 'min' {
    return secs >= 60 && secs % 60 === 0 ? 'min' : 's'
}
