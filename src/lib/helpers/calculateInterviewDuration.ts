// helpers/calculateDuration.ts

export function calculateInterviewDuration(questions: any[], buffer: number = 5): number | null {
    let totalTimeSeconds = 0;
    let hasTimeLimits = false;
    for (const q of questions) {
        const time = Number(q?.time_limit);
        if (time > 0) {
            hasTimeLimits = true;
            totalTimeSeconds += time;
        }
    }
    if (!hasTimeLimits) return null;
    const fullMinutes = Math.floor(totalTimeSeconds / 60);
    const remainingSeconds = totalTimeSeconds % 60;
    const roundedMinutes = fullMinutes + (remainingSeconds > 30 ? 1 : 0);
    return roundedMinutes + buffer;
}
