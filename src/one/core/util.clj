(ns one.core.util)

(defn insert [n value coll]
  (let [[coll' coll''] (split-at n coll)]
    (vec (concat coll' value coll''))))

(comment
(defn cursor-position [editor]
  (let [{:keys [cursor text]} (lens/lens-get lens/buffer editor)
        text (take (:y cursor) text)]
    (+ (:x cursor) (count text) (apply + (map count text)))))

(def word #"\w+")

(def find-word (partial re-seq word))

(defn find-forward [line x]
  (let [tokens (filter :type (parser/parse syntax/word (subs line x)))]
    (if (empty? tokens)
      (count line)
      (let [token (first tokens)]
        (+ (.cursor token) (count (.text token)))))))

(defn find-backward [line x]
  (let [tokens (filter :type (parser/parse syntax/word (subs line 0 x)))]
    (if (empty? tokens)
      0
      (.cursor (last tokens)))))
)