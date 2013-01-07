(ns felis.editor
  (:require [felis.core :as core]
            [felis.editor.row :as row]
            [felis.editor.buffer :as buffer]))

(declare map->Normal)

(defn keymap [editor keymap key]
  (if-let [f (keymap key)]
    (-> editor f map->Normal)
    editor))

(defn run [editor keymap key]
  (condp = key
    (core/escape keymap) (map->Normal editor)
    (core/left keymap) (row/left editor)
    (core/right keymap) (row/right editor)
    (core/up keymap) (buffer/top editor)
    (core/down keymap) (buffer/bottom editor)
    (core/perform editor (core/char key))))

(defrecord Insert [buffer]
  core/Editor
  (perform [this char]
    (row/insert this char)))

(defrecord ReplaceOnce [buffer]
  core/Editor
  (perform [this char]
    (-> this (row/replace char) map->Normal)))

(defrecord Replace [buffer]
  core/Editor
  (perform [this char]
    (row/replace this char)))

(def delete
  {\d buffer/delete
   \0 row/delete-lefts
   \9 row/delete-rights
   \h row/backspace
   \j buffer/delete
   \k buffer/backspace
   \l row/delete})

(defrecord Delete [buffer]
  core/Editor
  (perform [this char]
    (keymap this delete char)))

(def go
  {\0 buffer/start
   \9 buffer/end})

(defrecord Go [buffer]
  core/Editor
  (perform [this char]
    (keymap this go char)))

(def normal
  {\h row/left
   \j buffer/bottom
   \k buffer/top
   \l row/right
   \0 row/start
   \9 row/end
   \i map->Insert
   \a (comp map->Insert row/right)
   \I (comp map->Insert row/start)
   \A (comp map->Insert row/end)
   \o (comp map->Insert buffer/append)
   \O (comp map->Insert buffer/insert)
   \r map->ReplaceOnce
   \R map->Replace
   \x row/delete
   \X row/backspace
   \d map->Delete
   \g map->Go})

(defrecord Normal [buffer]
  core/Editor
  (perform [this char]
    (keymap this normal char)))
