sig Character {}

sig TextContent {
  string: set Character
}

sig File {
  contents: set TextContent
}

one sig Cursor {
  x: Int,
  y: Int
} {
  x >= 0
  y >= 0
}

abstract sig TextField {
  cursor: lone Cursor,
  contents: some TextContent
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

pred openFile (buffer: Buffer, file: File) {
  buffer.contents = file.contents
}

pred h (field, field': TextField) {
  field.cursor.x > 0
  field'.cursor.x = field.cursor.x - 1
}

pred j (field, field': TextField) {
  field.cursor.y < #field.contents.string - 1
  field'.cursor.y = field.cursor.y + 1
}

pred k (field, field': TextField) {
  field.cursor.y > 0
  field'.cursor.y = field.cursor.y - 1
}

pred l (field, field': TextField) {
  field.cursor.x < #field.contents.string - 1
  field'.cursor.x = field.cursor.x + 1
}

assert moveCursor {
  all field, field', field'': TextField |
    l [ field, field' ] and
    h [ field', field'' ] implies
    field.cursor = field''.cursor
  all field, field', field'': TextField |
    j [ field, field' ] and
    k [ field', field'' ] implies
    field.cursor = field''.cursor
}

check moveCursor

run l
