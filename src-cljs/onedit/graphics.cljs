(ns onedit.graphics
  (:require [clojure.browser.dom :as dom]
            [goog.graphics :as graphics]
            [onedit.core :as core]
            [onedit.style :as style]))

(defn render [editor]
  (dom/remove-children :display)
  (let [g (graphics/createSimpleGraphics 1024 1024)
        strings (core/get-strings editor)
        {:keys [x y]} (core/get-cursor editor)
        font (graphics/Font. style/font-size style/font-family)]
    (dotimes [n (count strings)]
      (.drawText g (strings n) 0 (* n style/font-size) nil nil nil nil font nil (graphics/SolidFill. style/text-color)))
    (doto g
      (.drawText (str (subs (strings y) 0 x) style/pointer) 0 (* y style/font-size) nil nil nil nil font nil (graphics/SolidFill. style/text-color))
      (.render (dom/ensure-element :display)))))
