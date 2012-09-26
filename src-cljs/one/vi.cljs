(ns one.vi
  (:require [one.core :as core]
            [one.cursor :as cursor]
            [one.buffer :as buffer]))

(declare normal-keymap)

(defn normal-mode [editor]
  (core/mode editor :normal #(if-let [f (% @normal-keymap)]
                               (f editor)
                               editor)))

(def insert-keymap
  (atom {:esc normal-mode
         :left cursor/left
         :down cursor/down
         :up cursor/up
         :right cursor/right}))

(defn insert-mode [editor]
  (core/mode editor :insert #(if-let [f (% @insert-keymap)]
                               (f editor)
                               (buffer/insert editor (name %)))))

(def delete-keymap
  (atom {:esc normal-mode
         :left (comp normal-mode buffer/backspace)
         :right (comp normal-mode buffer/delete)
         :h (comp normal-mode buffer/backspace)
         :l (comp normal-mode buffer/delete)
         :d (comp normal-mode buffer/delete-line)
         :w (comp normal-mode buffer/delete-forward)
         :b (comp normal-mode buffer/delete-backward)
         :| (comp normal-mode buffer/delete-to)
         :$ (comp normal-mode buffer/delete-from)}))

(defn delete-mode [editor]
  (core/mode editor :delete #(if-let [f (% @delete-keymap)]
                               (f editor)
                               (normal-mode editor))))

(def replace-keymap
  (atom {:esc normal-mode
         :left normal-mode
         :down normal-mode
         :up normal-mode
         :right normal-mode}))

(defn replace-mode [editor]
  (core/mode editor :replace #(if-let [f (% replace-keymap)]
                                (f editor)
                                (-> editor
                                    (buffer/replace-string (name %))
                                    normal-mode))))

(def normal
  (atom {:h cursor/left
         :j cursor/down
         :k cursor/up
         :l cursor/right
         :w cursor/forward
         :b cursor/backward
         :| cursor/start-line
         :$ cursor/end-line
;         :gg cursor/start-buffer
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
         :r replace-mode}))
