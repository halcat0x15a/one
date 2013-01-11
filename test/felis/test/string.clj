(ns felis.test.string
  (:refer-clojure :exclude [first rest last butlast])
  (:require [clojure.data.generators :as gen]
            [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.string :refer :all]))

(defspec non-empty
  split-lines
  [^string string]
  (is (not (empty? %))))
