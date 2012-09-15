(ns onedit.graphics
  (:require [clojure.browser.dom :as dom]
            [goog.dom.DomHelper :as dom-helper]
            [goog.graphics :as graphics]
            [goog.graphics.CanvasGraphics :as gcanvas]
            [onedit.core :as core]
            [onedit.style :as style]))

(defn render [editor]
  (let [canvas (dom/ensure-element :display)
        g (.getContext canvas "2d")
        strings (core/get-strings editor)
        {:keys [x y]} (core/get-cursor editor)
        font (graphics/Font. style/font-size style/font-family)
        color (graphics/SolidFill. style/text-color)]
    (set! (.-font g) (str style/font-size "px " style/font-family))
    (.clearRect g 0 0 1024 1024)
    (dotimes [n (count strings)]
      (.fillText g (strings n) 0 (* (inc n) style/font-size)))
    (doto g
      (.fillText (str (subs (strings y) 0 x) style/pointer) 0 (* (inc y) style/font-size)))))
