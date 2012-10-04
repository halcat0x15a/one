(ns one.core.parser
  (:require [clojure.string :as string]))

(defrecord Input [tokens cursor success source])

(deftype Token [type text])

(defn parse [parser source]
  (let [result (parser (Input. (transient []) 0 false source))]
    (persistent! (:tokens result))))

(defn sym [type regex]
  (fn [input]
    (let [source (:source input)
          token (re-find regex source)]
      (letfn [(consume [token]
                (let [token-size (count token)]
                  (conj! (:tokens input) (Token. type token))
                  (assoc input
                    :success true
                    :cursor (+ (:cursor input) token-size)
                    :source (subs source token-size))))]
        (cond (string? token) (consume token)
              (coll? token) (consume (first token))
              :else (assoc input :success false))))))

(defn exp [parser & parsers]
  (fn [input]
    (loop [input input parsers (cons parser parsers)]
      (if (empty? parsers) input
          (let [result ((first parsers) input)]
            (if (:success result)
              (recur result (rest parsers))
              result))))))

(defn select [parser & parsers]
  (fn [input]
    (loop [input input parsers (cons parser parsers)]
      (if (empty? parsers) input
          (let [result ((first parsers) input)]
            (if (:success result)
              result
              (recur result (rest parsers))))))))

(defn success [input]
  (assoc input :success true))

(defn opt [parser]
  (fn [input]
    (let [result (parser input)]
      (if (:success result)
        result
        (success result)))))

(defn rep [parser]
  (fn [input]
    (let [result (parser input)]
      (if (:success result)
        (recur result)
        (success result)))))

(defn parse-command [s editor]
  (let [[f & args] (string/split s #"\s+")]
    (when-let [f ((:functions editor) (keyword f))]
      (cons f args))))
