(ns felis.editor.vim
  (:require [felis.editor :as editor]
            [felis.editor.row :as row]
            [felis.editor.buffer :as buffer]))

(declare map->Normal)

(def global {:escape map->Normal})

(def insert
  {:left row/left
   :right row/right
   :up buffer/top
   :down buffer/bottom
   :backspace row/backspace
   :enter buffer/append-newline})

(defrecord Insert [buffer]
  editor/Editor
  (keymap [editor] (merge global insert))
  (input [editor char]
    (row/append editor char)))

(defrecord ReplaceOnce [buffer]
  editor/Editor
  (keymap [editor] global)
  (input [this char]
    (-> this (row/replace char) map->Normal)))

(defrecord Replace [buffer]
  editor/Editor
  (keymap [editor] global)
  (input [editor char]
    (-> editor (row/replace char) row/right)))

(def delete
  {\d buffer/delete
   \h row/backspace
   \j buffer/delete
   \k buffer/backspace
   \l row/delete})

(defrecord Delete [buffer]
  editor/Editor
  (keymap [editor] (merge global delete))
  (input [this char] (map->Normal this)))

(def go
  {\0 buffer/start
   \9 buffer/end})

(defrecord Go [buffer]
  editor/Editor
  (keymap [editor] (merge global go))
  (input [editor char] (map->Normal editor)))

(def normal
  {:left row/left
   :right row/right
   :up buffer/top
   :down buffer/bottom
   \h row/left
   \j buffer/bottom
   \k buffer/top
   \l row/right
   \0 row/start
   \9 row/end
   \i map->Insert
   \a (comp map->Insert row/right)
   \I (comp map->Insert row/start)
   \A (comp map->Insert row/end)
   \o (comp map->Insert buffer/append-newline)
   \O (comp map->Insert buffer/insert-newline)
   \r map->ReplaceOnce
   \R map->Replace
   \x row/delete
   \X row/backspace
   \d map->Delete
   \g map->Go})

(defrecord Normal [buffer]
  editor/Editor
  (keymap [editor] (merge global normal))
  (input [editor char] editor))

(def vim (Normal. felis.buffer/scratch))
