(ns one.parser
  (:require [clojure.string :as string]))

(defrecord Input [tokens ^long cursor ^boolean success ^String source])

(defrecord Token [^clojure.lang.Keyword type ^String text])

(defn parse [parser ^String source]
  (let [result (parser (Input. (transient []) 0 false source))]
    (assoc result
      :tokens (persistent! (:tokens result)))))

(defn sym [^clojure.lang.Keyword type ^java.util.regex.Pattern regex]
  (fn [^Input input]
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
  (fn [^Input input]
    (loop [input input parsers (cons parser parsers)]
      (if (empty? parsers) input
          (let [result ((first parsers) input)]
            (if (:success result)
              (recur result (rest parsers))
              result))))))

(defn select [parser & parsers]
  (fn [^Input input]
    (loop [input input parsers (cons parser parsers)]
      (if (empty? parsers) input
          (let [result ((first parsers) input)]
            (if (:success result)
              result
              (recur result (rest parsers))))))))

(defn success [^Input input]
  (assoc input :success true))

(defn opt [parser]
  (fn [^Input input]
    (let [result (parser input)]
      (if (:success result)
        result
        (success result)))))

(defn rep [parser]
  (fn [^Input input]
    (let [result (parser input)]
      (if (:success result)
        (recur result)
        (success result)))))
