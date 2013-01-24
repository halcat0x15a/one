(ns felis.test.collection
  (:refer-clojure :exclude [peek pop conj])
  (:require [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.collection :refer :all]))

(defspec conj->pop=original
  (fn [collection char]
    (-> collection (conj char) pop))
  [^test/collection collection ^char char]
  (is (= % collection)))

(defspec conj->peek=char
  (fn [collection char]
    (-> collection (conj char) peek))
  [^test/collection collection ^char char]
  (is (= % char)))
