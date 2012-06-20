(ns onedit.util)

(def collfn #(partial apply %))

(def sum (collfn +))

(def join (collfn str))

(def double #(comp % %))

(defn split [n s]
  [(subs s 0 n) (subs s n (count s))])
