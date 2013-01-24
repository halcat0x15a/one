(ns felis.canvas
  (:require [felis.buffer :as buffer]
            [felis.row :as row]
            [felis.buffer :as buffer]))

(defprotocol Canvas
  (text [this string x y]))

(def font-size (atom 16))

(defn draw
  ([canvas editor]
     (draw canvas editor @font-size))
  ([canvas editor size]
     (doseq [[y row] (->> editor :buffer buffer/sequence (map-indexed vector))]
       (text canvas (row/sequence row) 0 (+ (* y size) size)))))
