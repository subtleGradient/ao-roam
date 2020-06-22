declare global {
  interface Window {
    roamAlphaAPI?: {
      q: (query: string, ...args: (string | number)[]) => [number][]
      pull: (keys: string, dbid: number) => null | RoamBlock | RoamNode
    }
  }
}

export interface RoamDBRef {
  ":db/id": number
}

export interface RoamBlock extends RoamDBRef {
  ":block/uid": string
  ":block/refs"?: RoamDBRef[]
  ":block/children"?: RoamDBRef[]
  ":block/string": string
  ":block/open": boolean
  ":block/order": number
}

export interface RoamNode extends RoamBlock {
  ":node/title": string
}
