(ns onedit.vi
  (:require [onedit.cursor :as cursor]
            [onedit.buffer :as buffer]))

(declare normal-mode)

(defn mode [keymap]
  (fn [editor]
    (assoc editor
      :mode keymap)))

(def insert
  {:esc normal-mode})

(def insert-mode (mode insert))

(def delete
  {:esc normal-mode
   :d buffer/delete})

(def insert-mode (mode insert))

(def normal
  {:h cursor/left
   :j cursor/down
   :k cursor/up
   :l cursor/right
   :w cursor/forward
   :b cursor/backward
   :| cursor/start-line
   :$ cursor/end-line
   :gg cursor/start-buffer
   :G cursor/end-buffer
   :i insert-mode
   :o (comp insert-mode buffer/append-newline)
   :O (comp insert-mode buffer/prepend-newline)
   :x buffer/delete
   :X buffer/backspace
   :d delete-mode
   :r buffer/replace-string})

(def normal-mode (mode normal))
