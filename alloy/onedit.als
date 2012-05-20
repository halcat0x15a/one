sig Cursor {
  x: Int,
  y: Int
} {
  x >= 0
  y >= 0
}

sig TextContent {}

abstract sig TextField {
  cursor: Cursor,
  content: TextContent
}

sig Buffer extends TextField {}

sig MiniBuffer extends TextField {}

fact {
  #MiniBuffer = 1
  #Buffer = 1
}

pred openFile (buffer: Buffer, content': TextContent) {
  buffer.content = content'
}

pred h (cursor, cursor': Cursor) {
  cursor.x > 0
  cursor'.x = cursor.x - 1
}

pred j (cursor, cursor': Cursor) {
  cursor'.y = cursor.y + 1
}

pred k (cursor, cursor': Cursor) {
  cursor.y > 0
  cursor'.y = cursor.y - 1
}

pred l (cursor, cursor': Cursor) {
  cursor'.x = cursor.x + 1
}

assert moveCursor {
  all field, field', field'': TextField |
    l [ field.cursor, field'.cursor ] and
    h [ field'.cursor, field''.cursor ] implies
    field.cursor = field''.cursor
  all field, field', field'': TextField |
    j [ field.cursor, field'.cursor ] and
    k [ field'.cursor, field''.cursor ] implies
    field.cursor = field''.cursor
}

check moveCursor

run {}
run openFile
