(ns one.vi
  (:require [one.core :as core]
            [one.cursor :as cursor]
            [one.buffer :as buffer]))

(declare normal-mode)

(defn escape [keymap]
  (assoc keymap :esc normal-mode))

(def insert {})

(defn insert-mode [editor]
  (core/mode editor :insert (escape insert)))

(def delete
  {:d buffer/delete})

(defn delete-mode [editor]
  (core/mode editor :delete (escape delete)))

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

(defn normal-mode [editor]
  (core/mode editor :normal normal))
