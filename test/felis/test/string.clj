(ns felis.test.string
  (:refer-clojure :exclude [rest butlast])
  (:require [clojure.data.generators :as gen]
            [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.string :refer :all]))

(defspec not-empty-split-lines
  split-lines
  [^string _]
  (is (not (empty? %))))

(defspec not-nil-rest
  rest
  [^string _]
  (is (not (nil? %))))

(defspec not-nil-butlast
  butlast
  [^string _]
  (is (not (nil? %))))

(defspec not-contains-space
  (comp set nbsp)
  [^string _]
  (is (not (contains? % \space))))
