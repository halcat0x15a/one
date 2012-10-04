(ns one.core.tool
  (:require [one.core.buffer :as buffer]
            [one.core.parser :as parser]
            [one.core.lens :as lens]))

(defn commands [this]
  (->> this
       (buffer/create-buffer :commands)
       (lens/lens-set lens/text (vec (map name (keys (:functions this)))))))

(defn history [this]
  (->> this
       (buffer/create-buffer :history)
       (lens/lens-set lens/text (vec (:commands (:history this))))))

(defn apply-buffers [this command & args]
  (let [[f & _] (parser/parse-command command this)]
    (loop [this this buffers (:buffers this) result []]
      (if (empty? buffers)
        (->> this
             (buffer/create-buffer :apply-buffers)
             (lens/lens-set lens/text (vec result)))
        (let [[k v] (first buffers)
              this' (apply f (buffer/create-buffer k this) args)]
          (recur this' (rest buffers) (concat result (lens/lens-get lens/text this'))))))))

(defn grep [this pattern]
  (let [re (re-pattern pattern)]
    (->> this
         (buffer/create-buffer :grep)
         (lens/modify lens/text (comp vec (partial filter (partial re-find re)))))))

(defn count-lines [this]
  (->> this
       (buffer/create-buffer :count-lines)
       (lens/lens-set lens/text [(str (lens/count-lines this))])))

(defn sum [this]
  (->> this
       (buffer/create-buffer :sum)
       (lens/modify lens/text #(vector (str (apply + (map int (flatten (map (partial re-seq #"\d+") %)))))))))
