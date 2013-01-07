(ns felis.buffer
  (:require [clojure.string :as string]
            [felis.core :as core]
            [felis.zipper :as zipper]
            [felis.row :as row]))

(defrecord Buffer [name row tops bottoms]
  zipper/Zipper
  (value [this] :row)
  (lefts [this] :tops)
  (rights [this] :bottoms)
  core/Initialize
  (initialize [this]
    (Buffer. name row/empty [] []))
  core/Text
  (text [this]
    (->> (concat tops (list row) bottoms)
         (map core/text)
         (interpose \newline)
         string/join)))

(defn update [f editor]
  (if-let [buffer (-> editor :buffer f)]
    (assoc editor :buffer buffer)
    editor))

(defn delete [f editor]
  (let [buffer (:buffer editor)]
    (assoc editor
      :buffer (if-let [buffer' (f buffer)]
                buffer'
                (core/initialize buffer)))))

(def default :*scratch*)

(defn string-> [str]
  (let [rows (->> str core/split-lines (map row/string->))]
    (Buffer. default (first rows) [] (rest rows))))
