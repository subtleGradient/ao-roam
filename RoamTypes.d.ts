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
  ":block/order": number
  ":block/string": string

  ":block/refs"?: RoamDBRef[]

  ":block/open": boolean
  ":block/children"?: RoamDBRef[]

  ":create/email": string
  ":create/time": number
  ":edit/email": string
  ":edit/time": number
}

export interface RoamNode extends RoamBlock {
  ":node/title": string
  ":attrs/lookup"?: RoamDBRef[]
  ":entity/attrs"?: {
    ":source": [":block/uid", string]
    ":value": [":block/uid", string]
  }[]
  ":page/permissions"?: { ":public": null | any }
}
