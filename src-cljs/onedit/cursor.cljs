(ns onedit.cursor
  (:require [clojure.browser.dom :as dom]))

(defn value
  ([] [(value "left") (value "top")])
  ([attr]
     (let [str (aget (aget (dom/ensure-element :cursor) "style") attr)]
       (int (subs str 0 (- (count str) 2))))))

(defn update
  ([point] (apply update point))
  ([x y]
     (dom/set-properties :cursor {"style" (str "left: " x "ex; top: " y "em;")})))
