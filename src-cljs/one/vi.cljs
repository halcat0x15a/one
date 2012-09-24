(ns one.vi
  (:require [one.core :as core]
            [one.cursor :as cursor]
            [one.buffer :as buffer]))

(declare normal)

(defn normal-mode [editor]
  (core/mode editor :normal normal))

(def insert
  {:esc normal-mode})

(defn insert-mode [editor]
  (core/mode editor :insert insert))

(def delete
  {:esc normal-mode
   :d (comp normal-mode buffer/delete-line)
   :w (comp normal-mode buffer/delete-forward)
   :b (comp normal-mode buffer/delete-backward)
   :| (comp normal-mode buffer/delete-to)
   :$ (comp normal-mode buffer/delete-from)})

(defn delete-mode [editor]
  (core/mode editor :delete delete))

(def replace {})

(defn replace-mode [editor]
  (core/mode editor :replace replace))

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
   :I (comp insert-mode cursor/start-line)
   :a (comp insert-mode cursor/right)
   :A (comp insert-mode cursor/end-line)
   :o (comp insert-mode buffer/append-newline)
   :O (comp insert-mode buffer/prepend-newline)
   :x buffer/delete
   :X buffer/backspace
   :d delete-mode
   :r replace-mode})
