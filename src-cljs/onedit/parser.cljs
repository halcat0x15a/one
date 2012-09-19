(ns onedit.parser
  (:require [clojure.string :as string]))

(defrecord Parser [table cursor source])

(def parser (partial ->Parser {} 0))

(defn consume [regex this]
  (let [source (:source this)
        cursor (:cursor this)
        token (re-find regex source)]
    (map (fn [token]
           (let [token-size (count token)]
             (assoc this
               :cursor (+ cursor token-size)
               :source (subs source token-size))))
         (if (string? token) (list token) (take 1 token)))))

(defn sym
  ([regex] (partial consume regex))
  ([type regex]
     (fn [this]
         (map (fn [parser]
                  (assoc parser
                    :table (merge-with concat (:table parser) {type (list [(:cursor this) (:cursor parser)])})))
              (consume regex this)))))

(defn exp [sym & syms]
  (fn [this]
    (reduce #(mapcat %2 %1) (list this) (cons sym syms))))

(defn select [sym & syms]
  (fn [this]
    (take 1 (mapcat #(% this) (cons sym syms)))))

(defn opt [sym]
  (fn [this]
    (list (nth (sym this) 0 this))))

(defn rep [sym]
  (fn [this]
    (let [parser (sym this)]
      (if (empty? parser) (list this)
          (recur (first parser))))))