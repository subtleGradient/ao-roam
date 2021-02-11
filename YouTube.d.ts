export interface TranscriptBody {
  cueGroups: CueGroup[]
}

export interface CueGroup {
  transcriptCueGroupRenderer: TranscriptCueGroupRenderer
}

export interface TranscriptCueGroupRenderer {
  formattedStartOffset: HasSimpleText
  cues: Cue[]
}

export interface Cue {
  transcriptCueRenderer: TranscriptCueRenderer
}

export interface TranscriptCueRenderer {
  cue: HasSimpleText
  startOffsetMs: string
  durationMs: string
}

export interface HasSimpleText {
  simpleText: string
}
