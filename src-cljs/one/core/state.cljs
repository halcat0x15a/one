(ns one.core.state)

(deftype Pair [value state])

(defn bind [state f]
  (fn [a]
    (let [pair (state a)]
      ((f (.value pair)) (.state pair)))))

(defn bind' [state & xs]
  (reduce #(bind %1 (constantly %2)) state xs))

(defn get [a]
  (Pair. a a))

(defn run [state x]
  (state x))

(def eval (comp (memfn value) run))

(def exec (comp (memfn state) run))
