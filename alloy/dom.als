module dom

one sig Cursor {
  x: Int,
  y: Int
} {
  x >= 0
  y >= 0
}

abstract sig TextField {
  cursor: lone Cursor,
  contents: some String
} {
  cursor.y < #contents
  cursor.x < #contents.string
}

one sig Buffer extends TextField {}

one sig MiniBuffer extends TextField {}

one sig Editor {
  buffer: Buffer,
  miniBuffer: MiniBuffer
} {
  no buffer.contents & miniBuffer.contents
  no buffer.cursor & miniBuffer.cursor
  one buffer.cursor + miniBuffer.cursor
}
