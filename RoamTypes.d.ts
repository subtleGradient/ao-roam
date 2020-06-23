declare global {
  interface Window {
    roamAlphaAPI?: {
      q: (query: string, ...args: (string | number)[]) => [number][]
      pull: (keys: string, dbid: number) => RoamNode | null
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

type RoamAttrItem = [":block/uid", string]

type RoamAttr = {
  ":source": RoamAttrItem
  ":value": RoamAttrItem | string
}

export interface RoamNode extends RoamBlock {
  ":node/title": string
  ":attrs/lookup"?: RoamDBRef[]
  ":entity/attrs"?: [
    RoamAttr,
    RoamAttr,
    RoamAttr,
  ][]
  ":page/permissions"?: { ":public": null | any }
}

export type RoamId =
  | number
  | string
  | {
      ":block/uid"?: string
      ":db/id"?: number
    }
