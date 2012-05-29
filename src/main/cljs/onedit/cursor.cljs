(ns onedit.cursor
  (:require [onedit.core :as core]
            [goog.dom :as dom]
            [goog.string :as string]))

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
  (when-let [node (-> (.getStartNode range) f f)]
    (let [offset (min (.getStartOffset range) (dom/getNodeTextLength node))]
      (.moveToNodes range node offset node offset))))

(def move-top (partial move (partial vertical dom/getPreviousNode)))

(def move-bottom (partial move (partial vertical dom/getNextNode)))

(defn word [f range]
  (let [offset (f (map (partial apply str) (split-at (.getStartOffset range) (dom/getTextContent (.getStartNode range)))))]
    (.moveToNodes range (.getStartNode range) offset (.getEndNode range) offset)))

(defn forward [[s1 s2]]
  (+ (count s1) (count (re-find #"\s*\w+" s2))))

(defn backward [[s _]]
  (reduce + (map count (drop-last (re-seq #"\w+\s*" s)))))

(def move-forward (partial move (partial word forward)))

(def move-backward (partial move (partial word backward)))

(defn line [f range]
  (let [node (.getStartNode range)
        offset (f node)]
    (.moveToNodes range node offset node offset)))

(defn start [node] 0)

(defn end [node]
  (dom/getNodeTextLength node))

(def move-start (partial move (partial line start)))

(def move-end (partial move (partial line end)))
