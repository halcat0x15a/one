(ns felis.editor.insert
  (:require [felis.key :as key]
            [felis.editor :as editor]
            [felis.editor.text :as text]
            [felis.editor.buffer :as buffer]))

(def keymap
  {key/left text/left
   key/right text/right
   key/up buffer/top
   key/down buffer/bottom
   key/backspace text/backspace
   key/enter buffer/append-newline})

(defrecord Insert [root]
  editor/Editor
  (keymap [editor] keymap)
  (input [editor char]
    (text/append editor char)))
