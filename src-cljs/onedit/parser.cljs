(ns onedit.parser
  (:require [clojure.string :as string]))

(defrecord Input [table cursor success source])

(defn parse [parser source]
  (let [result (parser (Input. {} 0 false source))]
    (assoc result
      :table (:table result))))

(defn consume [regex this]
  (let [source (:source this)
        token (re-find regex source)]
    (letfn [(consume [token]
              (let [token-size (count token)]
                (assoc this
                  :success true
                  :cursor (+ (:cursor this) token-size)
                  :source (subs source token-size))))]
      (cond (string? token) (consume token)
            (coll? token) (consume (first token))
            :else (assoc this :success false)))))

(defn sym
  ([regex] (partial consume regex))
  ([type regex]
     (fn [input]
       (let [result (consume regex input)]
         (if (:success result)
           (assoc result
             :table (merge-with concat (:table result) {type (list [(:cursor input) (:cursor result)])}))
           result)))))

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
