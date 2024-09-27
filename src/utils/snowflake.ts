const epoch = 1672502400000n               // 2023-01-01 00:00:00.000
const workerIdBits = 9n                                // 机器ID的位数
const sequenceBits = 14n                              // 序列号的位数
const maxWorkerId = -1n ^ (-1n << workerIdBits)     // 机器ID的最大值
const maxSequence = -1n ^ (-1n << sequenceBits)     // 序列号的最大值
const workerIdShift = sequenceBits                    // 机器ID左移位数
const timestampShift = sequenceBits + workerIdBits  // 时间戳左移位数

function getBigIntTimestamp(): bigint {
    return BigInt(new Date().valueOf())
}

export class SnowFlake {
    private readonly workerId: bigint = 0n
    private sequence: bigint = 0n
    private lastTimestamp: bigint = 0n

    constructor(workerId: bigint) {
        if (workerId < 0n || workerId > maxWorkerId) {
            throw new Error(`"workerId必须在0-${maxWorkerId}之间"`)
        }
        this.workerId = workerId
        return this
    }

    public nextId(): bigint {
        let timestamp = getBigIntTimestamp()
        // 发生了时钟回拨，等待时钟追上
        if (timestamp < this.lastTimestamp) {
            console.log("发生了时钟回拨，等待时钟追上", timestamp, this.lastTimestamp)
            timestamp = this.wait()
        }
        if (timestamp === this.lastTimestamp) {
            this.sequence = (this.sequence + 1n) & maxSequence
            // 序列号溢出，等待下一毫秒
            if (this.sequence === 0n) {
                timestamp = this.waitNext()
            }
        } else {
            this.sequence = 0n
        }
        this.lastTimestamp = timestamp
        return ((timestamp - epoch) << (timestampShift)) | (this.workerId << workerIdShift) | this.sequence
    }

    // 等待直到now>=snowFlake.lastTimestamp
    private wait(): bigint {
        let timestamp = getBigIntTimestamp()
        for (; timestamp < this.lastTimestamp; timestamp = getBigIntTimestamp()) {
        }
        return timestamp
    }

    // 等待直到now>snowFlake.lastTimestamp
    private waitNext(): bigint {
        let timestamp = getBigIntTimestamp()
        for (; timestamp <= this.lastTimestamp; timestamp = getBigIntTimestamp()) {
        }
        return timestamp
    }
}

export function getTimestampFromSnowFlakeId(id: bigint): number {
    return Number((id >> timestampShift) + epoch)
}

export function getLocaleStringFromSnowFlakeId(id: bigint): string {
    // new Date(Number(id / BigInt(Math.pow(2, 23)) + 1672502400000n)).toLocaleString("cn")
    return new Date(getTimestampFromSnowFlakeId(id)).toLocaleString("cn")
}
