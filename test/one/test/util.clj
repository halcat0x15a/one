(comment
(ns one.test.util
  (:require [one.test :as test]
            [one.core.lens :as lens]
            [one.core.util :as util])
  (:use [clojure.test :only [is]]
        [clojure.test.generative :only [defspec]]
        [one.core.lens :only [lens-set]]))

(defspec count-lines
  (fn [text]
    (util/count-lines (lens-set lens/text text test/editor)))
  [^test/text text]
  (is (= % (count text))))

(defspec count-line
  (fn [buffer]
    (let [{:keys [text y]} buffer]
      (util/count-line y (lens-set lens/text text test/editor))))
  [^test/buffer buffer]
  (let [{:keys [text y]} buffer]
    (is (= % (-> text (get y) count)))))

(defspec insert-newline
  (fn [buffer]
    (let [{:keys [text y]} buffer]
      (util/insert-newline y text)))
  [^test/buffer buffer]
  (let [{:keys [text y]} buffer]
    (is (= % (vec (concat (take y text) (list "") (drop y text)))))))

(defspec cursor-position
  (comp util/cursor-position test/set-buffer)
  [^test/buffer buffer]
  (let [{:keys [text x y]} buffer
        text' (take y text)]
    (is (= % (+ x (count text') (apply + (map count text')))))))
)