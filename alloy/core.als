module core

sig Cursor {
  x: Int,
  y: Int
} {
  x >= 0
  y >= 0
}

sig Text {}

sig Name {}

sig Buffer {
  cursor: Cursor,
  contents: Text
} {
  some name: Name | name -> this in Editor.buffers
}

sig Editor {
  buffers: Name -> one Buffer,
  current: Name
} {
  some buffer: Buffer | current -> buffer in buffers
}

sig File {
  contents: Text
}

pred currentBuffer (editor: Editor, buffer: Buffer) {
  editor.current -> buffer in editor.buffers
}

pred updateBuffer (editor, editor': Editor, buffer, buffer': Buffer) {
  currentBuffer [editor, buffer]
  currentBuffer [editor', buffer']
  editor'.current = editor.current
  editor'.buffers - editor'.current -> buffer' = editor.buffers - editor.current -> buffer
}

run {
  some disj editor, editor': Editor, disj buffer, buffer': Buffer |
    updateBuffer [editor, editor', buffer, buffer']
} for 3 but exactly 2 Editor, exactly 3 Buffer

/*
pred updateContents (editor, editor': Editor, buffer, buffer': Buffer, contens: Text) {
  updateBuffer [editor, editor', buffer, buffer']
  buffer'.contents = contents

pred openFile (editor, editor': Editor, buffer: Buffer, file: File) {
  currentBuffer [editor, buffer]
  currentBuffer [editor', buffer]
  buffer.contents = file.contents
}

pred h (editor: Editor, buffer) {
  editor.current.cursor.x > 0
  editor'.current.cursor.x = editor.cursor.x - 1
}

pred j (editor, editor': Editor) {
  editor.cursor.y < #editor.contents.string - 1
  editor'.cursor.y = editor.cursor.y + 1
}

pred k (editor, editor': Editor) {
  editor.cursor.y > 0
  editor'.cursor.y = editor.cursor.y - 1
}

pred l (editor, editor': Editor) {
  editor.cursor.x < #editor.contents.string - 1
  editor'.cursor.x = editor.cursor.x + 1
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
