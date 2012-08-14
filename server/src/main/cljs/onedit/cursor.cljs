(ns onedit.cursor
  (:require [onedit.core :as core]
            [onedit.util :as util]
            [onedit.buffer :as buffer]
            [goog.dom :as dom]
            [goog.dom.Range :as dom-range]
            [goog.string :as string]))

(defn select [range node offset]
  (doto range
    (.moveToNodes node offset node offset false)
    (.select)))

(defn move [f g editor]
  (let [range (dom-range/createFromWindow)]
    (select range (f range) (g range))
    (core/mode editor)))

(def offset #(.getStartOffset %))

(def node #(.getStartNode %))

(def inc-offset (comp (util/collfn min) (juxt (comp alength node) (comp inc offset))))

(def dec-offset (comp (partial max 0) dec offset))

(def move-right (partial move node inc-offset))

(def move-left (partial move node dec-offset))

(def move-line #(comp first (partial drop-while nil?) (juxt (comp (util/double %) node) node)))

(def next-line (move-line dom/getNextNode))

(def prev-line (move-line dom/getPreviousNode))

(def move-bottom (partial move next-line offset))

(def move-top (partial move prev-line offset))

(def word (comp (partial map util/join) (util/collfn split-at) (juxt offset (comp dom/getRawTextContent node))))

(def forward (comp util/sum (juxt (comp count first) (comp count (partial re-find #"\s*\w+") second))))

(def backward (comp (util/collfn -) (juxt count (comp count last (partial re-seq #"\w+\s*"))) first))

(def move-forward (partial move node (comp forward word)))

(def move-backward (partial move node (comp backward word)))

(defn line [f range]
  (let [node (.getStartNode range)
        offset (f node)]
    (.moveToNodes range node offset node offset)))

(def start (constantly 0))

(def end (comp count dom/getRawTextContent node))

(def move-start (partial move (partial line start)))

(def move-end (partial move (partial line end)))
