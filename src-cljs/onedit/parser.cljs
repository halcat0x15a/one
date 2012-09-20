(ns onedit.parser
  (:require [clojure.string :as string]))

(defrecord Parser [table cursor success source])

(def parser (partial ->Parser {} 0 false))

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
            (nil? token) (assoc this :success false)))))

(defn sym
  ([regex] (partial consume regex))
  ([type regex]
     (fn [this]
       (let [parser (consume regex this)]
         (if (:success parser)
           (assoc parser
             :table (merge-with concat (:table parser) {type (list [(:cursor this) (:cursor parser)])}))
           parser)))))

(defn exp [sym & syms]
  (fn [this]
    (loop [parser this syms (cons sym syms)]
      (if (empty? syms) parser
          (let [parser ((first syms) parser)]
            (if (:success parser)
              (recur parser (rest syms))
              parser))))))

(defn select [sym & syms]
  (fn [this]
    (loop [parser this syms (cons sym syms)]
      (if (empty? syms) parser
          (let [parser' ((first syms) parser)]
            (if (:success parser')
              parser'
              (recur parser' (rest syms))))))))

(defn opt [sym]
  (fn [this]
    (let [parser (sym this)]
      (if (:success parser)
        parser
        (assoc parser
          :success true)))))

(defn rep [sym]
  (fn [this]
    (let [parser (sym this)]
      (if (and (:success parser) (not= this parser))
        (recur parser)
        (assoc parser
          :success true)))))
