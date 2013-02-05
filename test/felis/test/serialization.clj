(ns felis.test.serialization
  (:refer-clojure :exclude [read])
  (:require [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.serialization :refer :all]))

(defspec write-read
  (fn [string serializable]
    (->> string (read (type serializable)) write))
  [^string string ^test/serializable _]
  (is (= % string)))

(defspec read-write
  (fn [serializable]
    (->> serializable write (read (type serializable))))
  [^test/serializable serializable]
  (is (= % serializable)))
