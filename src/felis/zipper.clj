(ns felis.zipper
  (:refer-clojure :exclude [map])
  (:require [clojure.core :as core]))

(defprotocol Zipper
  (value [this])
  (lefts [this])
  (rights [this]))

(defn left [zipper]
  (let [value (value zipper)
        lefts (lefts zipper)
        rights (rights zipper)
        lefts' (lefts zipper)]
    (when-let [value' (first lefts')]
      (assoc zipper
        value value'
        lefts (rest lefts')
        rights (cons (value zipper) (rights zipper))))))

(defn right [zipper]
  (let [value (value zipper)
        lefts (lefts zipper)
        rights (rights zipper)
        rights' (rights zipper)]
    (when-let [value' (first rights')]
      (assoc zipper
        value value'
        lefts (conj (lefts zipper) (value zipper))
        rights (rest rights')))))

(defn start [zipper]
  (let [value (value zipper)
        lefts (lefts zipper)
        rights (rights zipper)
        lefts' (lefts zipper)]
    (when-let [value' (first lefts')]
      (assoc zipper
        value value'
        lefts []
        rights (concat (rest lefts') (cons (value zipper) (rights zipper)))))))

(defn end [zipper]
  (let [value (value zipper)
        lefts (lefts zipper)
        rights (rights zipper)
        rights' (rights zipper)]
    (when-let [value' (last rights')]
      (assoc zipper
        value value'
        lefts (concat (lefts zipper) (cons (value zipper) (drop-last rights')))
        rights []))))

(defn insert [zipper value']
  (let [value (value zipper)
        rights (rights zipper)]
    (assoc zipper
      value value'
      rights (cons (value zipper) (rights zipper)))))

(defn append [zipper value']
  (let [value (value zipper)
        lefts (lefts zipper)]
    (assoc zipper
      value value'
      lefts (conj (lefts zipper) (value zipper)))))

(defn delete [zipper]
  (let [value (value zipper)
        rights (rights zipper)
        rights' (rights zipper)]
    (when-let [value' (first rights')]
      (assoc zipper
        value value'
        rights (rest rights')))))

(defn backspace [zipper]
  (let [value (value zipper)
        lefts (lefts zipper)
        lefts' (lefts zipper)]
    (when-let [value' (last lefts')]
      (assoc zipper
        value value'
        lefts (drop-last lefts')))))

(defn map [zipper f]
  (let [value (value zipper)
        lefts (lefts zipper)
        rights (rights zipper)]
    (assoc zipper
      value (-> zipper value f)
      lefts (->> zipper lefts (core/map f))
      rights (->> zipper rights (core/map f)))))
