(ns onedit.graphics
  (:require [clojure.browser.dom :as dom]
            [goog.graphics :as graphics]
            [onedit.core :as core]
            [onedit.style :as style]))

(defn render [editor]
  (let [g (graphics/createSimpleGraphics 1024 1024)
        strings (core/get-strings editor)
        cursor (core/get-cursor editor)]
    (dotimes [n (count strings)]
      (.drawText g (strings n) 0 (* n style/font-size) nil nil "left" "top" (graphics/Font. style/font-size style/font-family) nil (graphics/SolidFill. style/text-color)))
    (doto g
      (.drawText style/pointer (* (:x cursor) style/font-size) (* (:y cursor) style/font-size) nil nil "left" "top" (graphics/Font. style/font-size style/font-family) nil (graphics/SolidFill. style/text-color))
      (.render (dom/ensure-element :display)))))
