(ns one.test.text
  (:require [one.test :as test]
            [one.core.lens :as lens]
            [one.core.util :as util]
            [one.core.text :as text])
  (:use [clojure.test :only [are]]
        [clojure.test.generative :only [defspec]]
        [one.core.lens :only [lens-set lens-get]]))

(defspec prepend-newline
  (comp text/prepend-newline test/set-buffer)
  [^test/buffer buffer]
  (let [{:keys [text y]} buffer]
    (are [a b] (= a b)
         (lens-get lens/text %) (util/insert-newline y text)
         (lens-get lens/cursor-x %) 0)))

(defspec append-newline
  (comp text/append-newline test/set-buffer)
  [^test/buffer buffer]
  (let [{:keys [text y]} buffer
        y' (inc y)]
    (are [a b] (= a b)
         (lens-get lens/text %) (util/insert-newline y' text)
         (lens-get lens/cursor-x %) 0
         (lens-get lens/cursor-y %) (if (< y (count text)) y' y))))

(defspec insert-newline
  (comp text/insert-newline test/set-buffer)
  [^test/buffer buffer]
  (let [{:keys [text x y]} buffer]
    (are [a b] (= a b)
         (lens-get lens/text %) (util/insert-newline x y text)
         (lens-get lens/cursor-x %) 0
         (lens-get lens/cursor-y %) (inc y))))

(defspec insert
  (fn [buffer s]
    (text/insert s (test/set-buffer buffer)))
  [^test/buffer buffer ^string s]
  (let [{:keys [text x y]} buffer
        line (text y)]
    (are [a b] (= a b)
         (lens-get (lens/line y) %) (str (subs line 0 x) s (subs line x))
         (lens-get lens/cursor-x %) (+ x (count s)))))
