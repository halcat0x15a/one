(ns felis.canvas
  (:require [felis.buffer :as buffer]
            [felis.row :as row]
            [felis.buffer :as buffer]
            [felis.canvas.color :as color]))

(defprotocol Canvas
  (color [canvas color])
  (text [canvas string x y]))

(def size (atom 16))

(def family (atom "monospace"))

(def foreground (atom color/white))

(def background (atom color/black))

(defn draw [canvas editor]
  (doseq [[index row] (->> editor :buffer buffer/sequence (map-indexed vector))]
    (let [y (+ (* index @size) @size)
          left (-> row :lefts :sequence)]
      (color canvas @foreground)
      (text canvas (-> row :lefts :sequence) 0 y)
      (color canvas @foreground)
      (text canvas (-> row :rights :sequence) (* (count left) size) y))))
