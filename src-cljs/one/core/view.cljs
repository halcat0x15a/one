(ns one.core.view)

(defrecord View [x y width height])

(defn view [width height]
  (View. 0 0 width height))
