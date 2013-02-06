(ns felis.test.serialization
  (:require [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.serialization :refer :all]))

(defspec serialize-deserialize
  (fn [string serializable]
    (->> string (deserialize (type serializable)) serialize))
  [^string string ^test/serializable serializable]
  (is (= % string)))

(defspec deserialize-serialize
  (fn [serializable]
    (->> serializable serialize (deserialize (type serializable))))
  [^test/serializable serializable]
  (is (= % serializable)))
