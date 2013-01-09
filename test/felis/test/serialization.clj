(ns felis.test.serialization
  (:refer-clojure :exclude [read])
  (:require [clojure.data.generators :as gen]
            [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.serialization :refer :all]))

(defspec string->serializable->string
  (fn [string serializable]
    (->> string (read (reader serializable)) write))
  [^string string ^test/serializable serializable]
  (is (= % string)))

(defspec serializable->string->serializable
  (fn [serializable]
    (->> serializable write (read (reader serializable))))
  [^test/serializable serializable]
  (is (= % serializable)))
