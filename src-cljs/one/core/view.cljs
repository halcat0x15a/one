(ns one.core.view
  (:require [one.core.lens :as lens]))

(defrecord View [x y width height])

(defn view [width height]
  (View. 0 0 width height))

(defn update-view [editor f]
  (assoc editor
    :view (f (:view editor))))

(defn up [editor]
  (update-view editor #(let [y (:y %)]
                         (if (> y 0)
                           (assoc % :y (dec y))
                           %))))

(defn down [editor]
  (update-view editor #(let [y (:y %)]
                         (if (< (+ y (:height %)) (lens/count-lines editor))
                           (assoc % :y (inc y))
                           %))))
