(ns onedit.syntax)

(defmacro do-m [b m]
  (let [[[fk fv] & t] (reverse (partition 2 b))
        f #(list %1 %2 (list 'fn (vector %3) %4))]
    (reduce (fn [l [k v]] (f 'onedit.core/bind v k l)) (f 'onedit.core/fmap fv fk m) t)))
