(ns onedit
  (:require [onedit.core :as core]
            [onedit.cursor :as cursor]
            [onedit.minibuffer :as minibuffer]
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
                    keycodes/ZERO cursor/move-start
                    keycodes/SEMICOLON minibuffer/focus
                    keycodes/ESC core/default-mode
                    keycodes/I core/insert-mode}
             true {keycodes/FOUR cursor/move-end}}
   :insert {false {keycodes/ESC core/default-mode}
            true {}}})

(defn key-handler [editor e]
  (core/log e.keyCode)
  (when-let [f (((keymap @editor.mode) e.shiftKey) e.keyCode)]
    (.preventDefault e)
    (f editor)))

(defn init-editor [editor]
  (events/listen (events/KeyHandler. editor.buffer) events/KeyHandler.EventType.KEY (partial key-handler editor)))

(defn init []
  (console/autoInstall)
  (doto (core/Editor. (atom :default) (dom/getElement "buffer") (minibuffer/create))
    (init-editor)
    (minibuffer/init functionmap)))
