(ns one.test.cursor
  (:require [one.test :as test]
            [one.core.record :as record]
            [one.core.lens :as lens]
            [one.core.util :as util]
            [one.core.cursor :as cursor])
  (:use [clojure.test :only [is are]]
        [clojure.test.generative :only [defspec]]
        [one.core.lens :only [lens-set lens-get]]))

(defspec left
  (comp cursor/left test/set-buffer)
  [^test/buffer buffer]
  (let [x (.x buffer)]
    (is (= (lens-get lens/cursor-x %)
           (if (pos? x) (dec x) x)))))

(defspec down
  (comp cursor/down test/set-buffer)
  [^test/buffer buffer]
  (let [{:keys [text y]} buffer]
    (is (= (lens-get lens/cursor-y %)
           (if (< y (dec (count text))) (inc y) y)))))

(defspec up
  (comp cursor/up test/set-buffer)
  [^test/buffer buffer]
  (let [y (.y buffer)]
    (is (= (lens-get lens/cursor-y %)
           (if (pos? y) (dec y) y)))))

(defspec right
  (comp cursor/right test/set-buffer)
  [^test/buffer buffer]
  (let [{:keys [text x y]} buffer]
    (is (= (lens-get lens/cursor-x %)
           (if (< x (count (text y))) (inc x) x)))))

(defspec start-line
  (comp cursor/start-line test/set-buffer)
  [^test/buffer buffer]
  (is (zero? (lens-get lens/cursor-x %))))

(defspec end-line
  (comp cursor/end-line test/set-buffer)
  [^test/buffer buffer]
  (let [{:keys [text y]} buffer]
    (is (= (lens-get lens/cursor-x %)
           (count (text y))))))

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
