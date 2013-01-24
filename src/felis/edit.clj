(ns felis.edit
  (:refer-clojure :exclude [sequence next]))

(defprotocol Edit
  (move [this field])
  (ins [this field value])
  (del [this field]))

(defmulti opposite identity)
(defmethod opposite :lefts [side] :rights)
(defmethod opposite :rights [side] :lefts)

(defn next [edit]
  (move edit :rights))

(defn prev [edit]
  (move edit :lefts))

(defn insert [edit value]
  (ins edit :rights value))

(defn append [edit value]
  (ins edit :lefts value))

(defn delete [edit]
  (del edit :rights))

(defn backspace [edit]
  (del edit :lefts))

(defn- until [f edit]
  (let [edit' (f edit)]
    (if (identical? edit edit')
      edit'
      (recur f edit'))))

(def start (partial until prev))

(def end (partial until next))

(def delete-all (partial until delete))

(def backspace-all (partial until backspace))

(defn cursor [edit]
  (loop [edit edit n 0]
    (let [edit' (prev edit)]
      (if (identical? edit' edit)
        n
        (recur edit' (inc n))))))
