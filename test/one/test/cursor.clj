(ns one.test.cursor
  (:require [one.test :as test]
            [one.core.data :as data]
            [one.core.lens :as lens]
            [one.core.state :as state]
            [one.core.cursor :as cursor])
  (:use [clojure.test :only [are]]
        [clojure.test.generative :only [defspec]]))

(defspec left
  (test/run cursor/left data/buffer)
  [^test/buffer buffer]
  (let [x (-> buffer :cursor :x)]
    (are [x'] (= x' (if (pos? x) (dec x) x))
         (lens/get data/x (.state %))
         (.value %))))

(defspec down
  (test/run cursor/down data/buffer)
  [^test/buffer buffer]
  (let [{:keys [text cursor]} buffer
        y (:y cursor)]
    (are [y'] (= y' (if (< y (dec (count text))) (inc y) y))
         (lens/get data/y (.state %))
         (.value %))))

(defspec up
  (test/run cursor/up data/buffer)
  [^test/buffer buffer]
  (let [y (-> buffer :cursor :y)]
    (are [y'] (= y' (if (pos? y) (dec y) y))
         (lens/get data/y (.state %))
         (.value %))))

(defspec right
  (test/run cursor/right data/buffer)
  [^test/buffer buffer]
  (let [{:keys [text cursor]} buffer
        {:keys [x y]} cursor]
    (are [x'] (= x' (if (< x (count (text y))) (inc x) x))
         (lens/get data/x (.state %))
         (.value %))))

(defspec start-line
  (test/run cursor/start-line data/buffer)
  [^test/buffer buffer]
  (are [x'] (zero? x')
       (lens/get data/x (.state %))
       (.value %)))

(defspec end-line
  (test/run cursor/end-line data/buffer)
  [^test/buffer buffer]
  (let [{:keys [text cursor]} buffer
        {:keys [x y]} cursor]
    (are [x'] (= x' (count (text y)))
         (lens/get data/x (.state %))
         (.value %))))

(defspec start-buffer
  (test/run cursor/start-buffer data/buffer)
  [^test/buffer buffer]
  (are [cursor] (= cursor (data/->Cursor 0 0))
       (lens/get data/cursor (.state %))
       (.value %)))

(defspec end-buffer
  (test/run cursor/end-buffer data/buffer)
  [^test/buffer buffer]
  (let [{:keys [text]} buffer
        y (dec (count text))]
    (are [cursor] (= cursor (data/->Cursor (count (text y)) y))
         (lens/get data/cursor (.state %))
         (.value %))))

(comment
(defspec forward
  (comp cursor/forward test/set-buffer)
  [^test/buffer buffer]
  (let [{:keys [text x y]} buffer]
    (is (= (lens-get lens/cursor-x %)
           (util/find-forward (text y) x)))))

(defspec backward
  (comp cursor/backward test/set-buffer)
  [^test/buffer buffer]
  (let [{:keys [text x y]} buffer]
    (is (= (lens-get lens/cursor-x %)
           (util/find-backward (text y) x)))))
)
