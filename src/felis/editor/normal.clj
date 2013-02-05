(ns felis.editor.normal
  (:refer-clojure :exclude [empty])
  (:require [felis.key :as key]
            [felis.group :as group]
            [felis.editor :as editor]
            [felis.editor.text :as text]
            [felis.editor.buffer :as buffer]
            [felis.editor.insert :as insert]
            [felis.editor.delete :as delete]
            [felis.editor.minibuffer :as minibuffer]))

(def keymap
  {key/left text/left
   key/right text/right
   key/up buffer/top
   key/down buffer/bottom
   \h text/left
   \j buffer/bottom
   \k buffer/top
   \l text/right
   \0 text/start
   \9 text/end
   \i insert/map->Insert
   \a (comp insert/map->Insert text/right)
   \I (comp insert/map->Insert text/start)
   \A (comp insert/map->Insert text/end)
   \o (comp insert/map->Insert buffer/append-newline)
   \O (comp insert/map->Insert buffer/insert-newline)
   \x text/delete
   \X text/backspace
   \d delete/map->Delete
   \: minibuffer/map->Minibuffer})

(defrecord Normal [root]
  editor/Editor
  (keymap [editor] keymap)
  (input [editor char] editor))

(def empty (Normal. group/empty))
