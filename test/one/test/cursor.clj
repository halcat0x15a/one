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
    (test/state-is data/x
                   (if (pos? x) (dec x) x)
                   %)))

(defspec down
  (test/run cursor/down data/buffer)
  [^test/buffer buffer]
  (let [{:keys [text cursor]} buffer
        y (:y cursor)]
    (test/state-is data/y
                   (if (< y (dec (count text))) (inc y) y)
                   %)))

(defspec up
  (test/run cursor/up data/buffer)
  [^test/buffer buffer]
  (let [y (-> buffer :cursor :y)]
    (test/state-is data/y
                   (if (pos? y) (dec y) y)
                   %)))

(defspec right
  (test/run cursor/right data/buffer)
  [^test/buffer buffer]
  (let [{:keys [text cursor]} buffer
        {:keys [x y]} cursor]
    (test/state-is data/x
                   (if (< x (count (text y))) (inc x) x)
                   %)))

(defspec start-line
  (test/run cursor/start-line data/buffer)
  [^test/buffer buffer]
    (test/state-is data/x
                   0
                   %))

(defspec end-line
  (test/run cursor/end-line data/buffer)
  [^test/buffer buffer]
  (let [{:keys [text cursor]} buffer
        {:keys [x y]} cursor]
    (test/state-is data/x
                   (count (text y))
                   %)))

(defspec start-buffer
  (test/run cursor/start-buffer data/buffer)
  [^test/buffer buffer]
  (test/state-is data/cursor (data/->Cursor 0 0) %))

(defspec end-buffer
  (test/run cursor/end-buffer data/buffer)
  [^test/buffer buffer]
  (let [{:keys [text]} buffer
        y (dec (count text))]
    (test/state-is data/cursor
                   (data/->Cursor (count (text y)) y)
                   %)))

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
