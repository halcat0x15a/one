(ns one.core.util
  (:require [one.core.lens :as lens]))

(def count-lines (comp count (partial lens/lens-get lens/text)))

(defn count-line [y editor]
  (when-let [line (lens/lens-get (lens/line y) editor)]
    (count line)))

(defn insert-newline
  ([x y text]
     (let [[text' text''] (split-at y text)
           line (first text'')]
       (vec (concat text' (list (subs line 0 x) (subs line x)) (rest text'')))))
  ([y text]
     (let [[text' text''] (split-at y text)]
       (vec (concat text' (list "") text'')))))

(defn cursor-position [editor]
  (let [{:keys [cursor text]} (lens/lens-get lens/buffer editor)
        text (take (:y cursor) text)]
    (+ (:x cursor) (count text) (apply + (map count text)))))

(def w #"\w")

(def word (partial re-matches w))

(defn move-while [pred f s n]
  (loop [x n]
    (if-let [c (get s x)]
      (if (pred (str c))
        (recur (f x))
        x)
      x)))

(defn move-while-word [f line x]
  (->> (move-while (complement word) f line x)
       (move-while word f line)))
