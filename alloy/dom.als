module dom

one sig Cursor {
  x: Int,
  y: Int
} {
  x >= 0
  y >= 0
}

sig Character {}

sig Text {
  characters: set Character
}

abstract sig TextField {
  cursor: lone Cursor,
  contents: Int one -> one Text
} {
  cursor.y < #contents
  some text: Text |
    cursor.y -> text in contents and
    cursor.x <= #text.characters
}

one sig Buffer extends TextField {}

one sig MiniBuffer extends TextField {}

one sig Editor {
  buffer: Buffer,
  miniBuffer: MiniBuffer
} {
  lone buffer.cursor + miniBuffer.cursor
}

pred h (field, field': TextField) {
  field.cursor.x > 0 implies
  field'.cursor.x = field.cursor.x - 1
}

pred j (field, field': TextField) {
  field.cursor.y < #field.contents - 1 implies
  field'.cursor.y = field.cursor.y + 1
}

pred k (field, field': TextField) {
  field.cursor.y > 0 implies
  field'.cursor.y = field.cursor.y - 1
}

pred l (field, field': TextField) {
  some text: Text |
    field.cursor.y -> text in field.contents and
    field.cursor.x < #text - 1 implies
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
