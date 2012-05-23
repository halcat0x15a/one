(ns onedit
  (:require [onedit.core :as core]
            [onedit.file :as file]
            [goog.debug.Console :as console]
            [goog.dom :as dom]
            [goog.events :as events]
            [goog.events.KeyHandler :as key-handler]))

(defn create-keymap [field]
  {true
   {79 #(file/open)
    83 #(file/save field)}
   false
   {}})

(defn key-handler [field keymap e]
  (.log js/console e)
  (core/log (str "keyhandler:" e.charCode))
  (core/log (str "keyhandler:" e.keyCode))
  (when-let [f ((keymap e.ctrlKey) e.keyCode)]
    (.preventDefault e)
    (f)))

(defn init-buffer [buffer]
  (let [keymap (create-keymap buffer)]
    (when (empty? (dom/getRawTextContent buffer))
      (dom/setTextContent buffer (if-let [t (.getItem core/local js/document.title)] t "")))
    (events/listen (goog.events.KeyHandler. buffer) goog.events.KeyHandler.EventType.KEY (partial key-handler buffer keymap))))

(defn init []
  (console/autoInstall)
  (doto (dom/getElement "buffer")
    (init-buffer)))
