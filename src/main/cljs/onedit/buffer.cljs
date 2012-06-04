(ns onedit.buffer
  (:require [goog.dom :as dom]
            [goog.events :as events]))

(defn create []
  (dom/getElement "buffer"))

(defn key-handler [editor keymap e]
  (when (= @editor.mode :default)
    (.preventDefault e))
  (when-let [f (((keymap @editor.mode) e.shiftKey) e.keyCode)]
    (.preventDefault e)
    (f editor)))

(defn init [editor keymap]
  (events/listen (events/KeyHandler. editor.buffer) events/KeyHandler.EventType.KEY (partial key-handler editor keymap)))
