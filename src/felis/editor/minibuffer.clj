(ns felis.editor.minibuffer
  (:require [felis.editor :as editor]
            [felis.editor.row :as row]))

(defrecord Minibuffer [buffer minibuffer]
  editor/Editor
  (keymap [editor] {})
  (input [editor char]
    (row/append minibuffer char)))
