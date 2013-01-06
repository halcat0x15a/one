(ns felis.editor
  (:require [felis.core :as core]
            [felis.editor.row :as row]
            [felis.editor.buffer :as buffer]))

(declare map->Normal)

(defn run [editor key]
  (if (= key :esc)
    (map->Normal editor)
    (if-let [action (-> editor core/keymap key)]
      (action editor)
      (core/perform editor key))))

(defrecord Insert [buffer]
  core/Editor
  (perform [this key]
    (row/insert this key))
  (keymap [this] {}))

(defrecord Replace [buffer]
  core/Editor
  (perform [this key]
    (map->Normal (row/insert this key)))
  (keymap [this] {}))

(defrecord Normal [buffer]
  core/Editor
  (perform [this key] this)
  (keymap [this]
    {\h row/left
     \j buffer/bottom
     \k buffer/top
     \l row/right
     \0 row/start
     \9 row/end
     \i (Insert. buffer)
     \a (row/right (Insert. buffer))
     \I (row/start (Insert. buffer))
     \A (row/end (Insert. buffer))
     \o (buffer/append (Insert. buffer))
     \O (buffer/insert (Insert. buffer))
     \r (Replace. buffer)
     \x row/delete
     \X row/backspace}))
