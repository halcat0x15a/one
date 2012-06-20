(ns onedit.buffer
  (:require [onedit.core :as core]
            [goog.dom :as dom]
            [goog.events :as events]))

(defn key-handler [editor e]
  (let [mode (core/action editor.mode editor e)]
    (.log js/console mode)
    (set! editor.mode mode)))

(defn init [editor]
  (events/listen (events/KeyHandler. editor.buffer) events/KeyHandler.EventType.KEY (partial key-handler editor)))
