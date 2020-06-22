interface RoamDBRef {
  ":db/id": number
}

interface RoamBlock extends RoamDBRef {
  ":block/uid": string
  ":block/refs"?: RoamDBRef[]
  ":block/children"?: RoamDBRef[]
  ":block/string": string
  ":block/open": boolean
  ":block/order": number
}

interface RoamNode extends RoamBlock {
  ":node/title": string
}
