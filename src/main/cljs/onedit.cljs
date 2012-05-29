(ns onedit
  (:require [onedit.core :as core]
            [onedit.cursor :as cursor]
            [onedit.file :as file]
            [goog.debug.Console :as console]
            [goog.dom :as dom]
            [goog.events :as events]
            [goog.events.KeyHandler :as key-handler]
            [goog.editor.Field :as field]))

(def keymap
  {:cursor {false {goog.events.KeyCodes.H cursor/move-left
                   goog.events.KeyCodes.J cursor/move-bottom
                   goog.events.KeyCodes.K cursor/move-top
                   goog.events.KeyCodes.L cursor/move-right
                   goog.events.KeyCodes.W cursor/move-forward
                   goog.events.KeyCodes.B cursor/move-backward
                   goog.events.KeyCodes.ZERO cursor/move-start
                   goog.events.KeyCodes.ESC (fn [_] (reset! core/mode nil))}
            true {goog.events.KeyCodes.FOUR cursor/move-end}}
   nil {false {goog.events.KeyCodes.ESC (fn [_] (reset! core/mode :cursor))}
        true nil}})

(defn key-handler [field e]
  (core/log e.keyCode)
  (core/log e.shiftKey)
  (when-let [f (((keymap @core/mode) e.shiftKey) e.keyCode)]
    (.preventDefault e)
    (f field)))

(defn init-buffer [field]
  (let [buffer (.getElement field)]
    (when (empty? (.getCleanContents field))
      (.setHtml field true (if-let [t (.getItem core/local js/document.title)] t "")))
    (events/listen (goog.events.KeyHandler. buffer) goog.events.KeyHandler.EventType.KEY (partial key-handler field))))

(defn init []
  (console/autoInstall)
  (doto (goog.editor.Field. "buffer")
    (.makeEditable)
    (init-buffer)))
