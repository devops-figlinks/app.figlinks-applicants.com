export const timerColor = (remainingTime: number) => {
    const timerColor = remainingTime <= 10 ? 'red' : 'black';
    return timerColor;
};