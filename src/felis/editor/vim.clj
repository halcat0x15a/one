(ns felis.editor.vim
  (:require [felis.editor :as editor]
            [felis.group :as group]
            [felis.empty :as empty]
            [felis.editor.text :as text]
            [felis.editor.buffer :as buffer]))

(declare map->Normal global)

(def insert
  {:left text/left
   :right text/right
   :up buffer/top
   :down buffer/bottom
   :backspace text/backspace
   :enter buffer/append-newline})

(defrecord Insert [root]
  editor/Editor
  (keymap [editor] (merge global insert))
  (input [editor char]
    (text/append editor char)))

(defrecord ReplaceOnce [root]
  editor/Editor
  (keymap [editor] global)
  (input [this char]
    (-> this (text/replace char) map->Normal)))

(defrecord Replace [root]
  editor/Editor
  (keymap [editor] global)
  (input [editor char]
    (-> editor (text/replace char) text/right)))

(def delete
  {\d buffer/delete
   \h text/backspace
   \j buffer/delete
   \k buffer/backspace
   \l text/delete})

(defrecord Delete [root]
  editor/Editor
  (keymap [editor] (merge global delete))
  (input [this char] (map->Normal this)))

(def go
  {\0 buffer/start
   \9 buffer/end})

(defrecord Go [root]
  editor/Editor
  (keymap [editor] (merge global go))
  (input [editor char] (map->Normal editor)))

(def normal
  {:left text/left
   :right text/right
   :up buffer/top
   :down buffer/bottom
   \h text/left
   \j buffer/bottom
   \k buffer/top
   \l text/right
   \0 text/start
   \9 text/end
   \i map->Insert
   \a (comp map->Insert text/right)
   \I (comp map->Insert text/start)
   \A (comp map->Insert text/end)
   \o (comp map->Insert buffer/append-newline)
   \O (comp map->Insert buffer/insert-newline)
   \r map->ReplaceOnce
   \R map->Replace
   \x text/delete
   \X text/backspace
   \d map->Delete
   \g map->Go})

(defrecord Normal [root]
  editor/Editor
  (keymap [editor] (merge global normal))
  (input [editor char] editor))

(defmethod empty/empty Normal [_]
  (Normal. (empty/empty felis.group.Group)))

(def global {:escape map->Normal})
