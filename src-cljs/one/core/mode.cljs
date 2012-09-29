(ns one.core.mode
  (:require [one.core :as core]
            [one.core.cursor :as cursor]
            [one.core.buffer :as buffer]
            [one.core.minibuffer :as minibuffer]))

(def general-mode
  (core/->Mode :general (fn [editor key]
                          (buffer/insert editor (name key)))))

(declare normal-keymap)

(def normal-mode
  (core/->Mode :normal (fn [editor key]
                         (if-let [f (key @normal-keymap)]
                           (f editor)
                           editor))))

(def insert-keymap
  (atom {:esc normal-mode
         :left cursor/left
         :down cursor/down
         :up cursor/up
         :right cursor/right}))

(def insert-mode
  (core/->Mode :insert (fn [editor key]
                         (if-let [f (key @insert-keymap)]
                           (f editor)
                           (buffer/insert editor (name key))))))

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

(def delete-mode
  (core/->Mode :delete (fn [editor key]
                         (if-let [f (key @delete-keymap)]
                           (f editor)
                           (normal-mode editor)))))

(def replace-keymap
  (atom {:esc normal-mode
         :left normal-mode
         :down normal-mode
         :up normal-mode
         :right normal-mode}))

(def replace-mode
  (core/->Mode :replace (fn [editor key]
                          (if-let [f (key replace-keymap)]
                            (f editor)
                            (-> editor
                                (buffer/replace-text (name key))
                                normal-mode)))))

(def normal-keymap
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

(def minibuffer-mode
  (core/->Mode :minibuffer (fn [editor key]
                             (case key
                               :up (minibuffer/set-prev-command editor)
                               :down (minibuffer/set-prev-command editor)
                               :enter 
                               editor))))
