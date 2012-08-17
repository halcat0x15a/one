(ns onedit.cursor
  (:require [clojure.browser.dom :as dom]))

(defrecord Cursor [x y])

(def unit (Cursor. 0 0))

(defn create
  ([] (Cursor. (create "left") (create "top")))
  ([attr]
     (let [str (aget (aget (dom/ensure-element :cursor) "style") attr)]
       (int (subs str 0 (- (count str) 2))))))

(defn update
  ([cursor] (update (:x cursor) (:y cursor)))
  ([x y]
     (dom/set-properties :cursor {"style" (str "left: " x "ex; top: " y "em;")})))
