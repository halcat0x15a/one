(ns onedit.cursor
  (:require [onedit.core :as core]
            [goog.dom :as dom]
            [goog.dom.Range :as range]
            [goog.string :as string]))

(defn create []
  (range/createFromWindow))

(defn move [f editor]
  (let [range (create)]
    (doto range
      (f)
      (.select))))

(defn move-n [editor node offset]
  (move (fn [range editor] (.moveToNodes range node offset node offset)) editor))

(defn horizontal [f pred range]
  (when (pred range)
    (.moveToNodes range (.getStartNode range) (f (.getStartOffset range)) (.getEndNode range) (f (.getEndOffset range)))))

(def move-left (partial move (partial horizontal dec #(> (.getStartOffset %) 0))))

(def move-right (partial move (partial horizontal inc #(< (.getStartOffset %) (alength (.getStartNode %))))))

(defn vertical [editor f range]
  (when-let [node (-> (.getStartNode range) f f)]
    (when (dom/contains editor.buffer node)
      (let [offset (min (.getStartOffset range) (dom/getNodeTextLength node))]
        (.moveToNodes range node offset node offset)))))

(defn move-top [editor]
  (move (partial vertical editor dom/getPreviousNode) editor))

(defn move-bottom [editor]
  (move (partial vertical editor dom/getNextNode) editor))

(defn word [f range]
  (let [offset (f (map (partial apply str) (split-at (.getStartOffset range) (dom/getRawTextContent (.getStartNode range)))))]
    (.moveToNodes range (.getStartNode range) offset (.getEndNode range) offset)))

(defn forward [[s1 s2]]
  (+ (count s1) (count (re-find #"\s*\w+" s2))))

(defn backward [[s _]]
  (apply + (map count (drop-last (re-seq #"\w+\s*" s)))))

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
