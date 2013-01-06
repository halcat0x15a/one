(ns felis.test.zipper
  (:refer-clojure :exclude [map identity])
  (:require [clojure.test.generative :refer :all]
            [clojure.core :as core]
            [felis.test :as test]
            [felis.zipper :refer :all]))

(defspec identity
  (fn [zipper] (map zipper core/identity))
  [^{:tag (test/zipper test/default)} zipper]
  (is (= % zipper)))
