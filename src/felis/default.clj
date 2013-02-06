(ns felis.default)

(defmulti default identity)

(defn default? [x]
  (= x (-> x type default)))
