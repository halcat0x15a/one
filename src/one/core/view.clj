(ns one.core.view
  (:require [one.core.lens :as lens]
            [one.core.util :as util]))

(defn up [editor]
  (letfn [(up' [view]
            (let [y (:y view)]
              (if (> y 0)
                (assoc view :y (dec y))
                view)))]
    (lens/modify lens/view up' editor)))

(defn down [editor]
  (letfn [(down' [view]
            (let [y (:y view)]
              (if (< (+ y (:height view)) (util/count-lines editor))
                (assoc view :y (inc y))
                view)))]
    (lens/modify lens/view down' editor)))
