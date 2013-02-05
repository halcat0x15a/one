(ns felis.test.collection
  (:refer-clojure :exclude [pop])
  (:require [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.collection :refer :all]))

(defspec not-nil-pop
  pop
  [^test/collection _]
  (is (not (nil? %))))
