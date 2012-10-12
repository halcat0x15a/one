(ns one.core.mode
  (:require [one.core.record :as record]
            [one.core.text :as text]
            [one.core.cursor :as cursor]
            [one.core.minibuffer :as minibuffer]))

(declare normal-keymap)

(def normal-mode
  (record/->Mode :normal (fn [editor key]
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
  (record/->Mode :insert (fn [editor key]
                   (if-let [f (key @insert-keymap)]
                     (f editor)
                     (text/insert editor (name key))))))

(def delete-keymap
  (atom {:esc normal-mode
         :left (comp normal-mode text/backspace)
         :right (comp normal-mode text/delete)
         :h (comp normal-mode text/backspace)
         :l (comp normal-mode text/delete)
         :d (comp normal-mode text/delete-line)
         :w (comp normal-mode text/delete-forward)
         :b (comp normal-mode text/delete-backward)
         :| (comp normal-mode text/delete-to)
         :$ (comp normal-mode text/delete-from)}))

(def delete-mode
  (record/->Mode :delete (fn [editor key]
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
  (record/->Mode :replace (fn [editor key]
                    (if-let [f (key replace-keymap)]
                      (f editor)
                      (-> editor
                          (text/replace-text (name key))
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
         :o (comp insert-mode text/append-newline)
         :O (comp insert-mode text/prepend-newline)
         :x text/delete
         :X text/backspace
         :d delete-mode
         :r replace-mode}))

(def minibuffer-mode
  (record/->Mode :minibuffer (fn [editor key]
                       (case key
                         :up (minibuffer/set-prev-command editor)
                         :down (minibuffer/set-prev-command editor)
                         :enter 
                         editor))))
