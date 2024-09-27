import config from "./config"
import Redis from "ioredis"

const redisHost = config.redis.address.split(":")[0]
const redisPort = Number(config.redis.address.split(":")[1] ?? 6379)
const redisOptions: any = {
    password: config.redis.password,
    db: config.redis.db,
}
if (config.redis.sentinel) {
    redisOptions.sentinels = config.redis.sentinelAddrs.map(addr=> {
        return {
            host: addr.split(":")[0],
            port: Number(addr.split(":")[1] ?? 26379),
        }
    })
    redisOptions.name = config.redis.masterName
    redisOptions.sentinelPassword = config.redis.password
}
export let redis = new Redis(redisPort, redisHost, redisOptions)

export function disconnect() {
    redis.disconnect()
}

export function recreate() {
    disconnect()
    redis = new Redis(redisPort, redisHost, redisOptions)
    return redis
}
