(ns one.test.cursor
  (:require [one.test :as test]
            [one.core.data :as data]
            [one.core.lens :as lens]
            [one.core.state :as state]
            [one.core.cursor :as cursor])
  (:use [clojure.test :only [are]]
        [clojure.test.generative :only [defspec]]))

(defspec left
  (comp (partial state/run cursor/left) test/set-buffer)
  [^test/buffer buffer]
  (let [x (-> buffer :cursor :x)]
    (are [x'] (= x' (if (pos? x) (dec x) x))
         (lens/get data/x (.state %))
         (.value %))))

(defspec down
  (comp (partial state/run cursor/down) test/set-buffer)
  [^test/buffer buffer]
  (let [{:keys [text cursor]} buffer
        y (:y cursor)]
    (are [y'] (= y' (if (< y (dec (count text))) (inc y) y))
         (lens/get data/y (.state %))
         (.value %))))

(defspec up
  (comp (partial state/run cursor/up) test/set-buffer)
  [^test/buffer buffer]
  (let [y (-> buffer :cursor :y)]
    (are [y'] (= y' (if (pos? y) (dec y) y))
         (lens/get data/y (.state %))
         (.value %))))

(defspec right
  (comp (partial state/run cursor/right) test/set-buffer)
  [^test/buffer buffer]
  (let [{:keys [text cursor]} buffer
        {:keys [x y]} cursor]
    (are [x'] (= x' (if (< x (count (text y))) (inc x) x))
         (lens/get data/x (.state %))
         (.value %))))

(defspec start-line
  (comp (partial state/run cursor/start-line) test/set-buffer)
  [^test/buffer buffer]
  (are [x'] (zero? x')
       (lens/get data/x (.state %))
       (.value %)))

(defspec end-line
  (comp (partial state/run cursor/end-line) test/set-buffer)
  [^test/buffer buffer]
  (let [{:keys [text cursor]} buffer
        {:keys [x y]} cursor]
    (are [x'] (= x' (count (text y)))
         (lens/get data/x (.state %))
         (.value %))))
(comment
(defspec start-buffer
  (comp cursor/start-buffer test/set-buffer)
  [^test/buffer buffer]
  (are [x] (zero? x)
       (lens-get lens/cursor-x %)
       (lens-get lens/cursor-y %)))

(defspec end-line
  (comp cursor/end-buffer test/set-buffer)
  [^test/buffer buffer]
  (let [{:keys [text]} buffer
        y' (dec (count text))]
    (are [a b] (= a b)
         (lens-get lens/cursor-x %) (count (text y'))
         (lens-get lens/cursor-y %) y')))

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