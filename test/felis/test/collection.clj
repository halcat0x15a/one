(ns felis.test.collection
  (:refer-clojure :exclude [peek pop conj sequence])
  (:require [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.empty :as empty]
            [felis.collection :refer :all]))

(defspec conj_xs_x->pop_xs=xs
  (fn [coll char]
    (-> coll (conj char) pop))
  [^test/collection collection ^char char]
  (is (= % collection)))

(defspec conj_xs_x->peek_xs=x
  (fn [coll char]
    (-> coll (conj char) peek))
  [^test/collection collection ^char char]
  (is (= % char)))

(defspec empty_pop_empty_xs
  (comp pop empty/empty type)
  [^test/collection collection]
  (is (empty/empty? %)))
