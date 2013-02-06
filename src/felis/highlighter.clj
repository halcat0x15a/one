(ns felis.highlighter
  (:require [clojure.core :as core]
            [clojure.string :as string]))

(defrecord Input [cursor source destination])

(defn parse [parser source]
  (parser (Input. 0 source "")))

(defn extract [x]
  (cond (coll? x) (first x)
        (string? x) x))

(defn highlight
  ([regex] (highlight regex identity))
  ([regex transform]
     (fn [{:keys [cursor source destination] :as input}]
       (if-let [result (re-find regex source)]
         (let [length (-> result extract count)]
           (Input. (+ cursor length)
                   (subs source length)
                   (str destination (transform result))))
         (assoc input
           :source ""
           :destination (str destination source))))))
