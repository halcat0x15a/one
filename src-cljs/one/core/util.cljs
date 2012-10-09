(ns one.core.util
  (:require [one.core.lens :as lens]))

(def count-lines (comp count (partial lens/lens-get lens/text)))

(defn count-line [y editor]
  (when-let [line (lens/lens-get (lens/line y) editor)]
    (count line)))

(defn insert-newline [y text]
  (let [[text' text''] (split-at y text)]
    (vec (concat text' (list "") text''))))

(defn cursor-position [editor]
  (let [{:keys [cursor text]} (lens/lens-get lens/buffer editor)
        text (take (:y cursor) text)]
    (+ (:x cursor) (count text) (apply + (map count text)))))
