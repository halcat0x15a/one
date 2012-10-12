(ns one.core.util
  (:require [one.core.lens :as lens]
            [one.core.syntax :as syntax]
            [one.core.parser :as parser]))

(def count-lines (comp count (partial lens/lens-get lens/text)))

(defn count-line [y editor]
  (when-let [line (lens/lens-get (lens/line y) editor)]
    (count line)))

(defn insert-newline
  ([x y text]
     (let [[text' text''] (split-at y text)
           line (first text'')]
       (vec (concat text' (list (subs line 0 x) (subs line x)) (rest text'')))))
  ([y text]
     (let [[text' text''] (split-at y text)]
       (vec (concat text' (list "") text'')))))

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
