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
  {:cursor {false {keycodes/H cursor/move-left
                   keycodes/J cursor/move-bottom
                   keycodes/K cursor/move-top
                   keycodes/L cursor/move-right
                   keycodes/W cursor/move-forward
                   keycodes/B cursor/move-backward
                   keycodes/ZERO cursor/move-start
                   keycodes/SEMICOLON minibuffer/focus
                   keycodes/ESC (fn [_] (reset! core/mode nil))}
            true {keycodes/FOUR cursor/move-end}}
   nil {false {keycodes/ESC (fn [_] (reset! core/mode :cursor))}
        true nil}})

(defn key-handler [editor e]
  (core/log e.keyCode)
  (when-let [f (((keymap @core/mode) e.shiftKey) e.keyCode)]
    (.preventDefault e)
    (f editor)))

(defn init-editor [editor]
  (when (empty? (.getCleanContents editor.buffer))
    (.setHtml editor.buffer true (if-let [t (.getItem core/local js/document.title)] t "")))
  (.log js/console (.getElement editor.buffer))
  (dom/appendChild (.getElement editor.buffer) (dom/createElement "pre"))
  (events/listen (events/KeyHandler. (.getElement editor.buffer)) events/KeyHandler.EventType.KEY (partial key-handler editor)))

(defn create-buffer []
  (doto (goog.editor.Field. "buffer")
    (.registerPlugin (goog.editor.plugins.BasicTextFormatter.))
    (.makeEditable)))

(defn init []
  (console/autoInstall)
  (doto (core/Editor. (create-buffer) (minibuffer/create))
    (init-editor)
    (minibuffer/init functionmap)))
