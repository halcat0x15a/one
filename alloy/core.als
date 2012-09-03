module core

sig Cursor {
  x: Int,
  y: Int
} {
  x >= 0
  y >= 0
}

sig Buffer {
  cursor: Cursor,
  strings: set String
} {
  this in Editor.buffers
}

one sig Editor {
  buffers: some Buffer,
  current: Buffer
} {
  current in buffers
}

sig File {
  contents: set String
}

pred openFile (editor: Editor, file: File) {
  editor.buffers.strings = file.contents
}

run openFile

/*
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
*/