(ns felis.editor.delete
  (:require [felis.key :as key]
            [felis.editor :as editor]
            [felis.editor.text :as text]
            [felis.editor.buffer :as buffer]))

(def keymap
  {\d buffer/delete
   key/left text/backspace
   key/up buffer/delete
   key/down buffer/backspace
   key/right text/delete
   \h text/backspace
   \j buffer/delete
   \k buffer/backspace
   \l text/delete})

(defrecord Delete [root]
  editor/Editor
  (keymap [editor] keymap)
  (input [editor char] editor))
