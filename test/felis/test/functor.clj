(ns felis.test.functor
  (:refer-clojure :exclude [map identity])
  (:require [clojure.test.generative :refer :all]
            [clojure.core :as core]
            [felis.test :as test]
            [felis.functor :refer :all]))

(defspec identity
  #(map % core/identity)
  [^test/editable editable]
  (is (= % editable)))
