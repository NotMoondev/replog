import { toRaw } from 'vue'

/** Deep-clone a reactive value by stripping Vue proxies and serialising through JSON. */
export function serialize<T>(data: T): T {
    return JSON.parse(JSON.stringify(toRaw(data as object))) as T
}
