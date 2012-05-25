(ns onedit.cursor
  (:require [onedit.core :as core]
            [goog.dom :as dom]))

(defn move [f field]
  (let [range (.getRange field)]
    (doto range
      (f)
      (.select))))

(defn horizontal [f pred range]
  (when (pred range)
    (.moveToNodes range (.getStartNode range) (f (.getStartOffset range)) (.getEndNode range) (f (.getEndOffset range)))))

(def move-left (partial move (partial horizontal dec #(> (.getStartOffset %) 0))))

(def move-right (partial move (partial horizontal inc #(< (.getStartOffset %) (alength (.getStartNode %))))))

(defn vertical [f range]
  (.moveToNodes range (f (f (.getStartNode range))) (.getStartOffset range) (f (f (.getEndNode range))) (.getEndOffset range)))

(def move-top (partial move (partial vertical dom/getPreviousNode)))

(def move-bottom (partial move (partial vertical dom/getNextNode)))
