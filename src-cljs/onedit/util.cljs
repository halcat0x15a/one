(ns onedit.util)

(defn drop-string [m n s]
  (str (subs s 0 m) (subs s n (count s))))
