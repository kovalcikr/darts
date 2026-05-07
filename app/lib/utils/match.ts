export function isMatchComplete(runTo: number, playerALegs: number, playerBlegs: number) {
    return playerALegs >= runTo || playerBlegs >= runTo;
}