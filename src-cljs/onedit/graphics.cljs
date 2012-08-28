(ns onedit.graphics
  (:require [clojure.browser.dom :as dom]
            [goog.graphics :as graphics]))

(defn render []
  (doto (graphics/createSimpleGraphics 100 100)
    (.drawText "gedasdlksajdso" 0 0 100 100 "left" "top" (graphics/Font. 16 "monospace") nil (graphics/SolidFill. "blue"))
    (.render (dom/ensure-element :cursor))))
  