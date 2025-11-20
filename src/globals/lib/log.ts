import console from 'console';

function prepare(color: string, ...logs: any[]) {
    const aLogs = [];
    for (let iter = 0; iter < logs.length; iter += 1) {
        aLogs.push(`\x1b${color}${typeof logs[iter] === 'object' ? JSON.stringify(logs[iter], null, 2) : logs[iter]}\x1b[0m`);
    }

    console.log(...aLogs);
}

const log = {
    black: (...logs: any[]) => prepare('[30m', ...logs),
    red: (...logs: any[]) => prepare('[31m', ...logs),
    green: (...logs: any[]) => prepare('[32m', ...logs),
    yellow: (...logs: any[]) => prepare('[33m', ...logs),
    blue: (...logs: any[]) => prepare('[34m', ...logs),
    magenta: (...logs: any[]) => prepare('[35m', ...logs),
    cyan: (...logs: any[]) => prepare('[36m', ...logs),
    white: (...logs: any[]) => prepare('[37m', ...logs),

    console: console.log,
    error: console.error,
    warn: console.warn,
    table: console.table,
    info: console.info,
    trace: console.trace,
} as const;

export default log;
