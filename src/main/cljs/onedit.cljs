(ns onedit
  (:require [onedit.core :as core]
            [onedit.cursor :as cursor]
            [onedit.file :as file]
            [goog.debug.Console :as console]
            [goog.dom :as dom]
            [goog.events :as events]
            [goog.events.KeyHandler :as key-handler]
            [goog.editor.Field :as field]))

(defn create-keymap [field]
  {:cursor
   {72 #(cursor/move-left field)
    74 #(cursor/move-bottom field)
    75 #(cursor/move-top field)
    76 #(cursor/move-right field)
    27 #(reset! core/mode nil)}
   nil
   {27 #(reset! core/mode :cursor)}})

(defn key-handler [field keymap e]
  (when-let [f ((keymap @core/mode) e.keyCode)]
    (core/log e.keyCode)
    (.preventDefault e)
    (f)))

(defn init-buffer [field]
  (let [keymap (create-keymap field)
        buffer (.getElement field)]
    (when (empty? (.getCleanContents field))
      (.setHtml field true (if-let [t (.getItem core/local js/document.title)] t "")))
    (events/listen (goog.events.KeyHandler. buffer) goog.events.KeyHandler.EventType.KEY (partial key-handler field keymap))))

(defn init []
  (console/autoInstall)
  (doto (goog.editor.Field. "buffer")
    (.makeEditable)
    (init-buffer)))
