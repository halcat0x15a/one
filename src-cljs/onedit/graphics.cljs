(ns onedit.graphics
  (:require [clojure.browser.dom :as dom]
            [goog.graphics :as graphics]
            [onedit.core :as core]
            [onedit.style :as style]))

(defn render [editor]
  (let [g (graphics/createSimpleGraphics 1024 1024)
        strings (core/get-strings editor)]
    (dotimes [n (count strings)]
      (.drawText g (nth strings n) 0 (* n 16) nil nil "left" "top" (graphics/Font. 16 "monospace") nil (graphics/SolidFill. "blue")))
    (doto g
      (.render (dom/ensure-element :display)))))
