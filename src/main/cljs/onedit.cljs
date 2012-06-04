(ns onedit
  (:require [onedit.core :as core]
            [onedit.buffer :as buffer]
            [onedit.minibuffer :as minibuffer]
            [onedit.cursor :as cursor]
            [onedit.deletion :as deletion]
            [onedit.file :as file]
            [goog.debug.Console :as console]
            [goog.dom :as dom]
            [goog.events :as events]
            [goog.events.KeyCodes :as keycodes]
            [goog.editor.plugins.BasicTextFormatter :as formatter]
            [goog.editor.Field :as field]))

(def functionmap
  {:open file/open})

(def keymap
  {:default {false {keycodes/H cursor/move-left
                    keycodes/J cursor/move-bottom
                    keycodes/K cursor/move-top
                    keycodes/L cursor/move-right
                    keycodes/W cursor/move-forward
                    keycodes/B cursor/move-backward
                    keycodes/X deletion/delete-character
                    keycodes/ZERO cursor/move-start
                    keycodes/SEMICOLON minibuffer/focus
                    keycodes/ESC core/default-mode
                    keycodes/I core/insert-mode}
             true {keycodes/FOUR cursor/move-end}}
   :insert {false {keycodes/ESC core/default-mode}
            true {}}})

(defn init []
  (console/autoInstall)
  (doto (core/Editor. (atom :default) (buffer/create) (minibuffer/create))
    (buffer/init keymap)
    (minibuffer/init functionmap)))
