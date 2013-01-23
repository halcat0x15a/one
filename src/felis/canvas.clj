(ns felis.canvas
  (:require [felis.buffer :as buffer]
            [felis.editable :as editable]))

(defprotocol Canvas
  (text [this string x y]))

(def font-size (atom 16))

(defn draw
  ([canvas editor]
     (draw canvas editor @font-size))
  ([canvas editor size]
     (doseq [[y row] (->> editor :buffer editable/sequence-indexed)]
       (text canvas (editable/sequence row) 0 (* y size)))))
